from crayonai_stream.best_effort_json_parser import parse


def test_empty_input():
    """Test empty and whitespace inputs"""
    assert parse("") == {}
    assert parse("   ") == {}
    assert parse("\n\t") == {}


def test_complete_json():
    """Test already complete JSON objects"""
    assert parse('{"a": 1}') == {"a": 1}
    assert parse('{"a": "b"}') == {"a": "b"}
    assert parse('{"a": true, "b": false}') == {"a": True, "b": False}


def test_incomplete_simple():
    """Test incomplete simple JSON objects"""
    assert parse('{"a": 1') == {"a": 1}
    assert parse('{"a": "b"') == {"a": "b"}
    assert parse('{"a": true') == {"a": True}


def test_nested_objects():
    """Test nested object structures"""
    assert parse('{"a": {"b": 1') == {"a": {"b": 1}}
    assert parse('{"a": {"b": {"c": true') == {"a": {"b": {"c": True}}}
    assert parse('{"a": {"b": 1}, "c": {"d": "text"') == {
        "a": {"b": 1},
        "c": {"d": "text"},
    }


def test_arrays():
    """Test arrays in JSON"""
    assert parse('{"a": [1, 2, 3]}') == {"a": [1, 2, 3]}
    assert parse('{"a": [1, 2, 3') == {"a": [1, 2, 3]}
    assert parse('{"a": [{"b": 1}, {"c": 2}') == {"a": [{"b": 1}, {"c": 2}]}
    # Test incomplete array with string value
    assert parse('{"key": ["val') == {"key": ["val"]}
    # Test the same case again to ensure consistency
    assert parse('{"key": ["val') == {"key": ["val"]}


def test_complex_structures():
    """Test complex nested structures"""
    assert parse('{"a": {"b": [1, 2, {"c": true') == {"a": {"b": [1, 2, {"c": True}]}}
    assert parse('{"data": {"users": [{"name": "John", "active": true') == {
        "data": {"users": [{"name": "John", "active": True}]}
    }


def test_escaped_quotes():
    """Test handling of escaped quotes in JSON strings"""
    # Test complete JSON with escaped quotes
    assert parse('{"key": "value with \\"quotes\\""}') == {"key": 'value with "quotes"'}
    # Test incomplete JSON with escaped quotes
    assert parse('{"key": "value with \\"quotes') == {"key": 'value with "quotes'}
    # Test incomplete JSON with escaped quotes in array
    assert parse('{"key": ["value with \\"quotes\\""]') == {
        "key": ['value with "quotes"']
    }
    # Test with escape at the end
    assert parse('{"key": "value\\\\') == {"key": "value\\"}
    # Test with escaped quote at the end
    assert parse('{"key": "value\\"') == {"key": 'value"'}


def test_special_numbers():
    """Test various number formats"""
    assert parse('{"a": 3.14') == {"a": 3.14}
    assert parse('{"a": -123') == {"a": -123}
    assert parse('{"a": 1.23e-4') == {"a": 1.23e-4}
    assert parse('{"a": [1.23e-4, -456, 3.14') == {"a": [1.23e-4, -456, 3.14]}


def test_null_values():
    """Test null values in different contexts"""
    assert parse('{"a": null') == {"a": None}
    assert parse('{"a": [null, 1, null') == {"a": [None, 1, None]}
    assert parse('{"a": {"b": null') == {"a": {"b": None}}


def test_empty_structures():
    """Test empty arrays and objects"""
    assert parse('{"a": []') == {"a": []}
    assert parse('{"a": {}') == {"a": {}}
    assert parse('{"a": [{}]') == {"a": [{}]}
    assert parse('{"a": {"b": []') == {"a": {"b": []}}


def test_complex_strings():
    """Test strings containing special characters and structures"""
    assert parse('{"a": "text with { and } inside"') == {
        "a": "text with { and } inside"
    }
    assert parse('{"a": "text with [ and ] inside"') == {
        "a": "text with [ and ] inside"
    }
    assert parse('{"a": "multiple \\"quoted\\" words"') == {
        "a": 'multiple "quoted" words'
    }
    assert parse('{"a": "\\\\\\""') == {"a": '\\"'}  # Testing multiple escapes
    assert parse('{"a": "line1\\nline2\\tindented"') == {"a": "line1\nline2\tindented"}


def test_multiple_incomplete_sections():
    """Test structures with multiple incomplete sections"""
    assert parse('{"a": {"b": [{"c": 1}, {"d": "text"}, {"e": [1, 2') == {
        "a": {"b": [{"c": 1}, {"d": "text"}, {"e": [1, 2]}]}
    }
    assert parse('{"a": [{"b": {"c": "text"}, "d": [1, {"e": true') == {
        "a": [{"b": {"c": "text"}, "d": [1, {"e": True}]}]
    }


def test_unicode_characters():
    """Test handling of unicode characters"""
    assert parse('{"a": "emoji 🎉"') == {"a": "emoji 🎉"}
    assert parse('{"a": "unicode ⚡️ chars"') == {"a": "unicode ⚡️ chars"}
    assert parse('{"a": "mixed unicode 🌟 and \\"quotes\\""') == {
        "a": 'mixed unicode 🌟 and "quotes"'
    }
