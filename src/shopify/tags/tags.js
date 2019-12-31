/* eslint-disable no-restricted-syntax */
const _ = require('lodash');
const ruleHelper = require('./rules');

/**
 * Settings
 */
const TAG_PREFIX = 'SMART-TAG_';

/**
 * Compares previous and new tags
 * to make sure we need an update
 */
const checkIfNeedsTagUpdate = (oldTags, newTags) => {
  const difference = _.difference(newTags, oldTags);
  const differenceReversed = _.difference(oldTags, newTags);
  return [...difference, ...differenceReversed].length > 0;
};

/**
 * Generates tags based on provided rules
 */
const generateNewTags = (rules, item) => {
  const oldTags = item.tags.split(',');
  const cleanTags = oldTags.filter(
    tag => !tag.includes(TAG_PREFIX) && tag !== ''
  );
  const enabledRules = rules.filter(rule => rule.enabled);
  let newTags = [];

  for (const rule of enabledRules) {
    const matchesRule = ruleHelper.evaluateRule(rule, item);

    if (matchesRule) {
      newTags = [...newTags, `${TAG_PREFIX}${rule.tag}`];
    }
  }

  return [...cleanTags, ...newTags];
};

/**
 * Creates list of tags to update
 */
module.exports.getNewItemTags = async (rules, items) => {
  let tagsToUpdate = [];

  for (const item of items) {
    const oldTags = item.tags;
    const newTags = generateNewTags(rules, item);
    const needsTagUpdate = checkIfNeedsTagUpdate(oldTags, newTags);

    if (needsTagUpdate) {
      tagsToUpdate = [...tagsToUpdate, { itemId: item.id, tags: newTags }];
    }
  }

  return tagsToUpdate;
};
