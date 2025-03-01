package backend

import (
	"sync"

	"github.com/google/zoekt"
	"github.com/google/zoekt/rpc"
	zoektstream "github.com/google/zoekt/stream"
	"github.com/sourcegraph/sourcegraph/internal/httpcli"
)

var zoektHTTPClient, _ = httpcli.NewInternalClientFactory("zoekt_webserver").Client()

// ZoektStreamFunc is a convenience function to create a stream receiver from a
// function.
type ZoektStreamFunc func(*zoekt.SearchResult)

func (f ZoektStreamFunc) Send(event *zoekt.SearchResult) {
	f(event)
}

// StreamSearchEvent has fields optionally set representing events that happen
// during a search.
//
// This is a Sourcegraph extension.
type StreamSearchEvent struct {
	// SearchResult is non-nil if this event is a search result. These should be
	// combined with previous and later SearchResults.
	SearchResult *zoekt.SearchResult
}

// ZoektDialer is a function that returns a zoekt.Streamer for the given endpoint.
type ZoektDialer func(endpoint string) zoekt.Streamer

// NewCachedZoektDialer wraps a ZoektDialer with caching per endpoint.
func NewCachedZoektDialer(dial ZoektDialer) ZoektDialer {
	d := &cachedZoektDialer{
		streamers: map[string]zoekt.Streamer{},
		dial:      dial,
	}
	return d.Dial
}

type cachedZoektDialer struct {
	mu        sync.RWMutex
	streamers map[string]zoekt.Streamer
	dial      ZoektDialer
}

func (c *cachedZoektDialer) Dial(endpoint string) zoekt.Streamer {
	c.mu.RLock()
	s, ok := c.streamers[endpoint]
	c.mu.RUnlock()

	if !ok {
		c.mu.Lock()
		s, ok = c.streamers[endpoint]
		if !ok {
			s = &cachedStreamerCloser{
				cachedZoektDialer: c,
				endpoint:          endpoint,
				Streamer:          c.dial(endpoint),
			}
			c.streamers[endpoint] = s
		}
		c.mu.Unlock()
	}

	return s
}

type cachedStreamerCloser struct {
	*cachedZoektDialer
	endpoint string
	zoekt.Streamer
}

func (c *cachedStreamerCloser) Close() {
	c.mu.Lock()
	delete(c.streamers, c.endpoint)
	c.mu.Unlock()

	c.Streamer.Close()
}

// ZoektDial connects to a Searcher HTTP RPC server at address (host:port).
func ZoektDial(endpoint string) zoekt.Streamer {
	client := rpc.Client(endpoint)
	streamClient := &zoektStream{
		Searcher: client,
		Client:   zoektstream.NewClient("http://"+endpoint, zoektHTTPClient),
	}
	return NewMeteredSearcher(endpoint, streamClient)
}

type zoektStream struct {
	zoekt.Searcher
	*zoektstream.Client
}
