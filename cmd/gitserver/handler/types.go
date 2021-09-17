package handler

// A Command is accepted by a Handler.
type Command interface {
	Args() map[string]string
}

// A Handler accepts Commands and returns a Result.
type Handler interface {
	Handle(Command) Result
}

// A Result is returned from a Handler.
type Result struct {
	Message string
	Error   error
}
