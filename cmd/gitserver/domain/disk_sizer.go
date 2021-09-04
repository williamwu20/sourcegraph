package domain

// A DiskSizer allows callers to determine the capacity of a volume, as well
// as the free space remaining on it.
type DiskSizer interface {
	BytesFreeOnDisk(path string) (uint64, error)
	DiskSizeBytes(path string) (uint64, error)
}
