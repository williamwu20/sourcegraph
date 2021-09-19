package slack

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cockroachdb/errors"
	"github.com/slack-go/slack"
)

var (
	ErrUserNotFound = errors.New("User not found")
)

const (
	tokenFileName = ".sg.slack.token.json"
)

type config struct {
	Token string `json:"token"`
}

func tokenFilePath() (string, error) {
	homedir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	tokenFilePath := filepath.Join(homedir, ".sourcegraph", tokenFileName)
	if err := os.MkdirAll(filepath.Dir(tokenFilePath), os.ModePerm); err != nil {
		return "", err
	}
	return tokenFilePath, nil
}

// retrieveToken obtains a token either from the cached configuration or by asking the user for it.
func retrieveToken() (string, error) {
	path, err := tokenFilePath()
	if err != nil {
		return "", err
	}
	f, err := os.Open(path)
	if err != nil {
		// Cannot find an existing token, let's ask the user for it.
		tok, err := getTokenFromUser()
		if err != nil {
			return "", err
		}
		err = saveToken(path, tok)
		if err != nil {
			return "", err
		}
		return tok, nil
	}
	defer f.Close()
	cfg := config{}
	err = json.NewDecoder(f).Decode(&cfg)
	if err != nil {
		return "", err
	}
	return cfg.Token, nil
}

// getTokenFromUser prompts the user for a slack OAuth token.
func getTokenFromUser() (string, error) {
	fmt.Println("Please find the Slack OAuth Token in the 1Password vault named 'TODO'")
	fmt.Printf("Paste it here: ")
	var token string
	if _, err := fmt.Scan(&token); err != nil {
		return "", err
	}
	return token, nil
}

// saveToken caches the token for further uses.
func saveToken(path string, token string) error {
	fmt.Printf("Saving credential file to: %s\n", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return errors.Wrap(err, "unable to cache oauth token")
	}
	defer f.Close()
	return json.NewEncoder(f).Encode(config{Token: token})
}

// QueryUserCurrentTime returns a given sourcegrapher current time, in its own timezone.
func QueryUserCurrentTime(nick string) (string, error) {
	token, err := retrieveToken()
	if err != nil {
		return "", err
	}
	return queryUserCurrentTime(token, nick)
}

func queryUserCurrentTime(token, nick string) (string, error) {
	// api := slack.New(token, slack.OptionDebug(true))
	api := slack.New(token)
	users, err := api.GetUsers()
	if err != nil {
		return "", err
	}
	u := findUserByNickname(users, nick)
	if u == nil {
		return "", errors.Wrapf(err, "cannot find nickname '%s'", nick)
	}
	loc, err := time.LoadLocation(u.TZ)
	if err != nil {
		return "", err
	}
	str := fmt.Sprintf("%s's current time is %s", nick, time.Now().In(loc).Format(time.RFC822))
	return str, nil
}

// QueryUserHandbook returns a link to a given sourcegrapher handbook profile.
func QueryUserHandbook(nick string) (string, error) {
	token, err := retrieveToken()
	if err != nil {
		return "", err
	}
	return queryUserHandbook(token, nick)
}

func queryUserHandbook(token, nick string) (string, error) {
	// api := slack.New(token, slack.OptionDebug(true))
	api := slack.New(token)
	users, err := api.GetUsers()
	if err != nil {
		return "", err
	}
	u := findUserByNickname(users, nick)
	if u == nil {
		return "", errors.Wrapf(err, "cannot find nickname '%s'", nick)
	}
	p, err := api.GetUserProfile(&slack.GetUserProfileParameters{
		UserID:        u.ID,
		IncludeLabels: true,
	})
	if err != nil {
		panic(err)
	}
	for _, v := range p.FieldsMap() {
		if v.Label == "Handbook link" {
			return v.Value, nil
		}
	}
	return "", ErrUserNotFound
}

// findUserByNickname searches for a user by its nickname, e.g. what we type in Slack after a '@' character.
// TODO would be great to have some "did you mean" and use Levenshtein distance or something else to return
// a list of possible matches.
func findUserByNickname(users []slack.User, nickname string) *slack.User {
	nickname = strings.ToLower(nickname)
	for _, u := range users {
		if strings.ToLower(u.Profile.DisplayName) == nickname || strings.ToLower(u.Profile.RealName) == nickname {
			return &u
		}
	}
	return nil
}
