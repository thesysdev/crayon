Feature: Component property descriptions in generated prompts
  Scenario: Describe component properties to the model
    Given a component with Zod descriptions on required and optional properties
    When its library generates a system prompt
    Then each described property is documented below its component signature
    And the component signature and component description are preserved

  Scenario: Preserve descriptions through schema wrappers
    Given a property described before optional, nullable, or default wrappers
    When its library generates a system prompt
    Then the property description is included
    And a description on the outer wrapper takes precedence

  Scenario: Preserve prompt output for undescribed properties
    Given a component without property descriptions
    When its library generates a system prompt
    Then its component signature line is unchanged

  Scenario: Distinguish prompt configurations locally
    Given two prompt specs that differ only in property descriptions
    When their configuration hashes are calculated locally
    Then their hashes differ
    And reordering property description keys does not change the hash
