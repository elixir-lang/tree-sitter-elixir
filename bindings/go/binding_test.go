package tree_sitter_elixir_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_elixir "github.com/elixir-lang/tree-sitter-elixir/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_elixir.Language())
	if language == nil {
		t.Errorf("Error loading Elixir grammar")
	}
}
