import { info } from '@actions/core';
import { createComment, generateComment, generateCoverageSummary, generateJestCommand, getCoveragePercent } from './utils';

export const start = async () => {
  info('Estoy en start');
  const jestCommand = generateJestCommand();
  const coverageSummary = await generateCoverageSummary(jestCommand);
  const percent = await getCoveragePercent();
  const comment = generateComment(percent, coverageSummary);
  await createComment(comment);
};
