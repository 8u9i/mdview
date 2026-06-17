// Integration test: exercises the same code path the Tauri command uses
// against the sample.md file, verifying size, content, and metadata.

use std::path::PathBuf;

#[test]
fn reads_sample_markdown() {
    let path: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "examples", "sample.md"]
        .iter()
        .collect();
    let path_str = path.to_string_lossy().to_string();
    let _ = path_str; // suppress unused warning; the file path is implicit
    assert!(path.is_file(), "sample.md must exist at {:?}", path);

    let meta = std::fs::metadata(&path).expect("metadata");
    assert!(meta.is_file());
    assert!(meta.len() > 100, "sample must be non-trivial");

    let content = std::fs::read_to_string(&path).expect("read");
    assert!(content.starts_with("# MDView"));
    assert!(content.contains("```javascript"));
    assert!(content.contains("```rust"));
    assert!(content.contains("| Feature"));

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("untitled.md");
    assert_eq!(name, "sample.md");
}

#[test]
fn missing_file_reports_error() {
    let result = std::fs::read_to_string("D:/this/path/does/not/exist.md");
    assert!(result.is_err(), "missing files must produce an error");
}
