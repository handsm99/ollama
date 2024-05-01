package server

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
)

type Layer struct {
	MediaType string `json:"mediaType"`
	Digest    string `json:"digest"`
	Size      int64  `json:"size"`
	From      string `json:"from,omitempty"`

	MergeBase string `json:"merge_base,omitempty"`

	message string
}

func NewLayer(r io.Reader, mediatype string) (*Layer, error) {
	blobs, err := GetBlobsPath("")
	if err != nil {
		return nil, err
	}

	temp, err := os.CreateTemp(blobs, "sha256-")
	if err != nil {
		return nil, err
	}
	defer temp.Close()
	defer os.Remove(temp.Name())

	sha256sum := sha256.New()
	n, err := io.Copy(io.MultiWriter(temp, sha256sum), r)
	if err != nil {
		return nil, err
	}

	if err := temp.Close(); err != nil {
		return nil, err
	}

	digest := fmt.Sprintf("sha256:%x", sha256sum.Sum(nil))
	blob, err := GetBlobsPath(digest)
	if err != nil {
		return nil, err
	}

	status := "using existing layer"
	if _, err := os.Stat(blob); err != nil {
		status = "creating new layer"
		if err := os.Rename(temp.Name(), blob); err != nil {
			return nil, err
		}
	}

	return &Layer{
		MediaType: mediatype,
		Digest:    digest,
		Size:      n,
		message:   fmt.Sprintf("%s %s", status, digest),
	}, nil
}

func NewLayerFromLayer(digest, mediatype, from string) (*Layer, error) {
	blob, err := GetBlobsPath(digest)
	if err != nil {
		return nil, err
	}

	fi, err := os.Stat(blob)
	if err != nil {
		return nil, err
	}

	return &Layer{
		MediaType: mediatype,
		Digest:    digest,
		Size:      fi.Size(),
		From:      from,
		message:   fmt.Sprintf("using existing layer %s", digest),
	}, nil
}

func (l *Layer) Open() (*os.File, error) {
	blob, err := GetBlobsPath(l.Digest)
	if err != nil {
		return nil, err
	}

	return os.Open(blob)
}
