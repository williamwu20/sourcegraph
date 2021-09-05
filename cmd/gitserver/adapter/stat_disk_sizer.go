package adapter

import (
	"syscall"
)

// NewStatDiskSizer returns a pointer to an initialized StatDiskSizer.
func NewStatDiskSizer() *StatDiskSizer {
	return &StatDiskSizer{}
}

// A StatDiskSizer returns capacity metadata about a volume.
type StatDiskSizer struct{}

// BytesFreeOnDisk returns the remaining storage capacity for a volume, or an error.
func (s *StatDiskSizer) BytesFreeOnDisk(path string) (uint64, error) {
	var fs syscall.Statfs_t
	if err := syscall.Statfs(path, &fs); err != nil {
		return 0, err
	}
	return fs.Bavail * uint64(fs.Bsize), nil
}

// DiskSizeBytes returns the total storage capacity for a volume, or an error.
func (s *StatDiskSizer) DiskSizeBytes(path string) (uint64, error) {
	var fs syscall.Statfs_t
	if err := syscall.Statfs(path, &fs); err != nil {
		return 0, err
	}
	return fs.Blocks * uint64(fs.Bsize), nil
}
