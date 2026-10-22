"""OC-02 schema conformance tests. Run: python -m unittest discover -s tests -p 'test_core_schema.py'"""
import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

SCHEMA = json.loads((Path(__file__).resolve().parents[1] / "schemas/core/0.1.0/records.schema.json").read_text())
VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker())

BASE = {"schemaVersion": "0.1.0", "id": "item-1", "version": 1,
        "createdAt": "2026-10-22T19:00:00Z", "producer": "synthetic-test"}
SOURCE = {**BASE, "recordType": "source", "locator": "https://example.org/feed",
          "sourceType": "web", "displayName": "Synthetic feed"}
CAPTURE = {**BASE, "recordType": "capture", "sourceRef": "source-1",
           "capturedAt": "2026-10-22T19:01:00Z",
           "contentDigest": "sha256:" + "a" * 64, "mediaType": "application/json",
           "retrievalMethod": "http"}
EVIDENCE = {**BASE, "recordType": "evidence", "captureRefs": ["capture-1"],
            "assertion": "Synthetic claim", "method": "extraction",
            "limitations": "Test fixture only"}
OBSERVATION = {**BASE, "recordType": "observation", "subjectRef": "subject-1",
               "evidenceRefs": ["evidence-1"], "observedAt": "2026-10-22T19:02:00Z",
               "value": {"count": 2}, "methodVersion": "1.0"}


class TestCoreSchema(unittest.TestCase):
    def test_schema_is_valid(self):
        Draft202012Validator.check_schema(SCHEMA)

    def test_non_gc_records_validate(self):
        for record in (SOURCE, CAPTURE, EVIDENCE, OBSERVATION):
            with self.subTest(recordType=record["recordType"]):
                self.assertEqual(list(VALIDATOR.iter_errors(record)), [])

    def test_missing_provenance_reference_fails(self):
        for record in ({**EVIDENCE, "captureRefs": []},
                       {**OBSERVATION, "evidenceRefs": []}):
            self.assertFalse(VALIDATOR.is_valid(record))

    def test_invalid_digest_fails(self):
        self.assertFalse(VALIDATOR.is_valid({**CAPTURE, "contentDigest": "sha256:invalid"}))

    def test_duplicate_refs_fail(self):
        self.assertFalse(VALIDATOR.is_valid({**EVIDENCE, "captureRefs": ["a", "a"]}))

    def test_invalid_timestamp_fails(self):
        self.assertFalse(VALIDATOR.is_valid({**CAPTURE, "capturedAt": "not-a-date"}))

    def test_unknown_record_type_fails(self):
        self.assertFalse(VALIDATOR.is_valid({**SOURCE, "recordType": "gc-special"}))

    def test_missing_common_fields_fail(self):
        record = dict(SOURCE)
        del record["producer"]
        self.assertFalse(VALIDATOR.is_valid(record))

    def test_extensions_must_be_namespaced(self):
        self.assertFalse(VALIDATOR.is_valid({**SOURCE, "extensions": {"unscoped": True}}))
        self.assertTrue(VALIDATOR.is_valid({**SOURCE, "extensions": {"gc:classification": "Q3"}}))


    def test_remaining_record_types_validate(self):
        base = dict(BASE)
        digest = "sha256:" + "b" * 64
        records = [
            {**base, "recordType": "provenanceEdge", "fromRef": "capture-1",
             "toRef": "evidence-1", "relation": "supports",
             "assertedAt": "2026-10-22T19:00:00Z"},
            {**base, "recordType": "verificationResult", "targetRef": "capture-1",
             "procedureId": "sha256-check", "procedureVersion": "1",
             "checkedAt": "2026-10-22T19:00:00Z", "outcome": "passed",
             "limitations": "Checks bytes, not claim truth"},
            {**base, "recordType": "changeEvent", "beforeRef": "obs-1-v1",
             "afterRef": "obs-1-v2", "comparisonVersion": "1",
             "changes": [{"path": "/value", "changeType": "modified"}]},
            {**base, "recordType": "publicationCandidate",
             "recordRefs": ["evidence-1"], "manifestDigest": digest,
             "payloadDigest": digest, "preparedAt": "2026-10-22T19:00:00Z",
             "policyRef": "external-policy-1"}
        ]
        for record in records:
            with self.subTest(recordType=record["recordType"]):
                self.assertEqual(list(VALIDATOR.iter_errors(record)), [])

    def test_invalid_verification_outcome_fails(self):
        record = {**BASE, "recordType": "verificationResult",
                  "targetRef": "capture-1", "procedureId": "check",
                  "procedureVersion": "1", "checkedAt": "2026-10-22T19:00:00Z",
                  "outcome": "certified", "limitations": "synthetic"}
        self.assertFalse(VALIDATOR.is_valid(record))

    def test_empty_change_list_fails(self):
        record = {**BASE, "recordType": "changeEvent", "beforeRef": "v1",
                  "afterRef": "v2", "comparisonVersion": "1", "changes": []}
        self.assertFalse(VALIDATOR.is_valid(record))

    def test_publication_candidate_needs_digest(self):
        record = {**BASE, "recordType": "publicationCandidate",
                  "recordRefs": ["a"], "manifestDigest": "not-a-digest",
                  "payloadDigest": "sha256:" + "c" * 64,
                  "preparedAt": "2026-10-22T19:00:00Z", "policyRef": "policy"}
        self.assertFalse(VALIDATOR.is_valid(record))


if __name__ == "__main__":
    unittest.main()
