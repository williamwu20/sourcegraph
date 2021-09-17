package command

// NewCloneCommand returns an initialized CloneCommand.
func NewCloneCommand(src, dst string) CloneCommand {
	return CloneCommand{
		src: src,
		dst: dst,
	}
}

// A CloneCommand is used to trigger a git-clone operation.
type CloneCommand struct {
	src string
	dst string
}

// Args implements the Command interface.
func (c CloneCommand) Args() map[string]string {
	return map[string]string{
		"src": c.src,
		"dst": c.dst,
	}
}
