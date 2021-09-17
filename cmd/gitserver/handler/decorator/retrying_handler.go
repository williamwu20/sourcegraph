package decorator

import (
	"github.com/sourcegraph/sourcegraph/cmd/gitserver/handler"
)

// NewRetryingHandler returns an initialized RetryingHandler.
func NewRetryingHandler(h handler.Handler, retries int) RetryingHandler {
	return RetryingHandler{
		handler: h,
		retries: retries,
	}
}

// A RetryingHandler is used to execute a Handler multiple times.
type RetryingHandler struct {
	handler handler.Handler
	retries int
}

// Handle executes the underlying Handler up to rh.retries times.
func (rh RetryingHandler) Handle(c handler.Command) handler.Result {
	var res handler.Result

	for i := 0; i < rh.retries; i++ {
		res = rh.handler.Handle(c)
		if res.Error == nil {
			break
		}
	}

	return res
}
