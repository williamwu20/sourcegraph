package handler

import (
	"os/exec"
)

// NewRevParseHandler returns an initialized RevParseHandler.
func NewRevParseHandler() RevParseHandler {
	return RevParseHandler{}
}

// A RevParseHandler accepts RevParseCommands.
type RevParseHandler struct{}

// Handle executes the supplied RevParseCommand.
func (rph RevParseHandler) Handle(revParse Command) Result {
	dir := revParse.Args()["dir"]
	rev := revParse.Args()["rev"]

	cmd := exec.Command("git", "rev-parse", rev)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()

	return Result{
		Message: string(out),
		Error:   err,
	}
}
