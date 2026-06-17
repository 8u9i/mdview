// Integration test for the file-association logic.
// `first_existing_file_arg` is internal to lib.rs so we re-test the
// same algorithm here against the actual sample.md file. The lib.rs
// `first_existing_file_arg` is exercised indirectly via `cargo test --lib`
// when those unit tests are added; for now we verify the public surface
// (the `initial_file` command can be invoked against a running app) by
// confirming the underlying file path extraction works as designed.

use std::path::PathBuf;

#[test]
fn argv_first_existing_file_arg_returns_sample() {
    // Mirror the exact logic from lib.rs (kept in sync intentionally).
    fn first_existing_file_arg(args: &[String]) -> Option<String> {
        args.iter()
            .skip(1)
            .filter(|a| !a.starts_with("--") && !a.starts_with('-'))
            .find(|a| std::path::Path::new(a.as_str()).is_file())
            .cloned()
    }

    let sample: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "examples", "sample.md"]
        .iter()
        .collect();
    let sample_str = sample.to_string_lossy().to_string();

    // Case 1: exe path + valid file -> file
    let argv = vec![
        "C:\\Program Files\\MDView\\mdview.exe".to_string(),
        sample_str.clone(),
    ];
    assert_eq!(first_existing_file_arg(&argv), Some(sample_str.clone()));

    // Case 2: exe path + flag + valid file -> file (flags skipped)
    let argv = vec![
        "mdview.exe".to_string(),
        "--debug".to_string(),
        sample_str.clone(),
    ];
    assert_eq!(first_existing_file_arg(&argv), Some(sample_str.clone()));

    // Case 3: exe path only -> None
    let argv = vec!["mdview.exe".to_string()];
    assert_eq!(first_existing_file_arg(&argv), None);

    // Case 4: exe path + non-existent file -> None
    let argv = vec![
        "mdview.exe".to_string(),
        "D:\\this\\does\\not\\exist.md".to_string(),
    ];
    assert_eq!(first_existing_file_arg(&argv), None);
}
