package main

import (
	"context"

	"github.com/cockroachdb/errors"
	"github.com/sourcegraph/sourcegraph/dev/sg/internal/slack"
)

func peopleExec(ctx context.Context, args []string) error {
	if len(args) == 0 {
		return errors.New("no people command given")
	}
	switch args[0] {
	case "time":
		if len(args) != 2 {
			return errors.New("no nickname given")
		}
		str, err := slack.QueryUserCurrentTime(args[1])
		if err != nil {
			return err
		}
		out.Writef(str)
		return nil
	case "handbook":
		if len(args) != 2 {
			return errors.New("no nickname given")
		}
		str, err := slack.QueryUserHandbook(args[1])
		if err != nil {
			return err
		}
		openURL(str)
		return nil
	default:
		return nil
	}
}
