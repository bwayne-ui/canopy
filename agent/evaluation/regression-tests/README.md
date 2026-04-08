# Regression tests

When the eval runner detects a score drop and drafts a proposal in `learning/skill-proposals/`, the human reviewer should:

1. Reproduce the failure case here as a permanent regression test.
2. Add it to the relevant `eval-suites/<skill>/` directory.
3. Confirm it fails on the unimproved skill and passes on the improved one.

This way every fix is locked in.
