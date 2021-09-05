package domain

import (
	"github.com/cockroachdb/errors"
)

const (
	defaultMinPercentFree = 10.0
	gibibyte              = float64(1024 * 1024 * 1024)
)

// NewDiskSpaceReclaimer returns a pointer to an initialized DiskSpaceReclaimer.
func NewDiskSpaceReclaimer(diskSizer DiskSizer, logger Logger, minPercentFree float64) *DiskSpaceReclaimer {
	if minPercentFree <= 0 {
		minPercentFree = defaultMinPercentFree
	}
	return &DiskSpaceReclaimer{
		diskSizer:      diskSizer,
		logger:         logger,
		minPercentFree: minPercentFree,
	}
}

// A DiskSpaceReclaimer inspects a volume to determine if its remaining space
// satisfies the current free space policy. If not, the least-recently updated
// repositories are removed to reclaim space.
type DiskSpaceReclaimer struct {
	diskSizer      DiskSizer
	logger         Logger
	minPercentFree float64
}

// ReclaimIfNecessary determines the total and free space of a volume, then
// removes least-recently updated repositories to reclaim space (if necessary).
func (d *DiskSpaceReclaimer) ReclaimIfNecessary(path string) (int64, error) {
	bytesToFree, err := d.howManyBytesToFree(path)
	if err != nil {
		return 0, errors.Wrap(err, "reclaiming free space")
	}

	// TODO: reclaim the space. The code to iterate and delete repositories
	//  has a number of dependencies that need to be broken.
	return bytesToFree, nil
}

// howManyBytesToFree returns the number of bytes that should be freed to make sure
// there is sufficient disk space free to satisfy s.DesiredPercentFree.
func (d *DiskSpaceReclaimer) howManyBytesToFree(path string) (int64, error) {
	freeBytes, err := d.diskSizer.BytesFreeOnDisk(path)
	if err != nil {
		return 0, errors.Wrap(err, "getting disk bytes free")
	}
	totalBytes, err := d.diskSizer.DiskSizeBytes(path)
	if err != nil {
		return 0, errors.Wrap(err, "getting disk size in bytes")
	}

	desiredFreeBytes := uint64(d.minPercentFree / 100.0 * float64(totalBytes))
	howManyBytesToFree := int64(desiredFreeBytes - freeBytes)
	if howManyBytesToFree < 0 {
		howManyBytesToFree = 0
	}

	d.logger.Debug("cleanup",
		"desired percent free", d.minPercentFree,
		"actual percent free", float64(freeBytes)/float64(totalBytes)*100.0,
		"amount to free in GiB", float64(howManyBytesToFree)/gibibyte)
	return howManyBytesToFree, nil
}
