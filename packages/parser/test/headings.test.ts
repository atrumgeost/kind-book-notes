import { describe, expect, it } from 'vitest';
import { splitMergedHeading } from '../src';

describe('splitMergedHeading', () => {
  it('leaves a highlight that is only a heading alone', () => {
    expect(splitMergedHeading('The Approach')).toBeNull();
    expect(splitMergedHeading('Six We Don’t See the Garden as It Is, We See It as We Are')).toBeNull();
    expect(splitMergedHeading('Listening (with Distance)')).toBeNull();
  });

  it('finds a heading before the paragraph', () => {
    expect(splitMergedHeading('Values and Seasons You might be thinking that this sounds simplistic.')).toEqual({
      heading: 'Values and Seasons',
      after: 'You might be thinking that this sounds simplistic.',
    });
  });

  it('drops connector words when the paragraph repeats the heading’s words', () => {
    expect(splitMergedHeading('One Seed by Seed Seed by seed, a field becomes a forest.')).toEqual({
      heading: 'One Seed by Seed',
      after: 'Seed by seed, a field becomes a forest.',
    });
  });

  it('finds a heading after the paragraph', () => {
    expect(splitMergedHeading('Some days the garden needs nothing from you. Tools to Overcome It')).toEqual({
      before: 'Some days the garden needs nothing from you.',
      heading: 'Tools to Overcome It',
    });
  });

  it('finds a heading after a colon at the end', () => {
    expect(splitMergedHeading('There are three kinds of weeds: Creeping Roots')).toEqual({
      before: 'There are three kinds of weeds:',
      heading: 'Creeping Roots',
    });
  });

  it('finds a heading between two paragraphs', () => {
    expect(
      splitMergedHeading('Plan the beds in winter. Dry Spells: When the Rain Stops We have seen this before in every summer.'),
    ).toEqual({
      before: 'Plan the beds in winter.',
      heading: 'Dry Spells: When the Rain Stops',
      after: 'We have seen this before in every summer.',
    });
  });

  it('prefers the longer heading when both ends look like one (epigraph attributions)', () => {
    expect(
      splitMergedHeading('Five Be Kind to Your Soil The secret is patience, then everything grows.—Ana R. Silva, The Patient Plot'),
    ).toEqual({
      heading: 'Five Be Kind to Your Soil',
      after: 'The secret is patience, then everything grows.—Ana R. Silva, The Patient Plot',
    });
  });

  it('does not split when the rest does not look like prose', () => {
    expect(splitMergedHeading('Borrowed Wishes: the Seeds Come from outside the Fence')).toBeNull();
  });

  it('does not split a sentence with no heading in it', () => {
    expect(splitMergedHeading('Plant what you love, and the people who love the same plants will find you.')).toBeNull();
  });

  it('copes with a paragraph cut off mid-sentence', () => {
    expect(splitMergedHeading('Respond Kindly Once you understand why the plant is wilting, it is time to make a plan for')).toEqual({
      heading: 'Respond Kindly',
      after: 'Once you understand why the plant is wilting, it is time to make a plan for',
    });
  });
});
