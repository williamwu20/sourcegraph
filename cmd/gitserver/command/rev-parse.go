package command

// NewRevParseCommand returns an initialized RevParseCommand.
func NewRevParseCommand(dir, rev string) RevParseCommand {
	return RevParseCommand{
		dir: dir,
		rev: rev,
	}
}

// A RevParseCommand is used to trigger a git-rev-parse operation.
type RevParseCommand struct {
	dir string
	rev string
}

// Args implements the Command interface.
func (r RevParseCommand) Args() map[string]string {
	return map[string]string{
		"dir": r.dir,
		"rev": r.rev,
	}
}
