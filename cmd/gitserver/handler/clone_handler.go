package handler

import (
	"os/exec"
)

// NewCloneHandler returns an initialized CloneHandler.
func NewCloneHandler() CloneHandler {
	return CloneHandler{}
}

// A CloneHandler accepts CloneCommands.
type CloneHandler struct{}

// Handle executes the supplied CloneCommand.
func (ch CloneHandler) Handle(clone Command) Result {
	src := clone.Args()["src"]
	dst := clone.Args()["dst"]

	cmd := exec.Command("git", "clone", src, dst)
	out, err := cmd.CombinedOutput()

	return Result{
		Message: string(out),
		Error:   err,
	}
}
