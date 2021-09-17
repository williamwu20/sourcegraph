package main

import (
	"log"

	"github.com/sourcegraph/sourcegraph/cmd/gitserver/command"
	"github.com/sourcegraph/sourcegraph/cmd/gitserver/handler"
	"github.com/sourcegraph/sourcegraph/cmd/gitserver/handler/decorator"
)

func main() {
	var cmd handler.Command
	var hnd handler.Handler
	var res handler.Result

	// CLONE //////////////////////////////////////////////////////////////////
	cmd = command.NewCloneCommand(
		"https://github.com/flying-robot/commit-sink.git",
		"/Users/aharris/tmp/commit-sink",
	)
	hnd = handler.NewCloneHandler()
	res = hnd.Handle(cmd)
	log.Printf("op=clone err=%v", res.Error)

	// RETRYING CLONE /////////////////////////////////////////////////////////
	cmd = command.NewCloneCommand(
		"https://github.com/flying-robot/commit-sink.git",
		"/Users/aharris/tmp/commit-sink",
	)
	hnd = decorator.NewRetryingHandler(handler.NewCloneHandler(), 3)
	res = hnd.Handle(cmd)
	log.Printf("op=retrying-clone err=%v", res.Error)

	// REV-PARSE //////////////////////////////////////////////////////////////
	cmd = command.NewRevParseCommand(
		"/Users/aharris/tmp/commit-sink",
		"HEAD",
	)
	hnd = handler.NewRevParseHandler()
	res = hnd.Handle(cmd)
	log.Printf("op=clone err=%v rev=%v", res.Error, res.Message)
}
