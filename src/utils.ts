import { exec } from '@actions/exec';
import { context, getOctokit } from '@actions/github';
import { error, getInput, warning } from '@actions/core';

// eslint-disable-next-line no-unused-vars
type CommandResultFormatter = (input: string[]) => string;

export const stringFormatter: CommandResultFormatter = (input: string[]) => input.join('\n');

export const summaryFormatter: CommandResultFormatter = (input: string[]) =>
  stringFormatter(input.slice(1, input.length - 1));

export const execCommand = async (command: string, formatter = stringFormatter): Promise<string> => {
  const workingDir = getInput('working-directory');
  const output: string[] = [];
  const options = {
    silent: true,
    listeners: {
      stdline: (data: string) => {
        output.push(data);
      }
    },
    cwd: `./${workingDir}`
  };
  try {
    await exec(command, [], options);
    return Promise.resolve(formatter(output));
  } catch (e) {
    error(`ExecCommand error: ${e}`);
    return Promise.reject(e);
  }
};

export const getCoveragePercent = async (): Promise<number> => {
  const percent = await execCommand('npx coverage-percentage ./coverage/lcov.info --lcov');
  return Number(parseFloat(percent).toFixed(2));
};

export const generateComment = (percent: number, summary: string): string =>
  `<p>Total Coverage: <code>${percent} %</code></p>
<details><summary>Coverage report</summary>

${summary}

</details>`;

export const getIssueNumber = (payload): number | undefined =>
  payload?.pull_request?.number ||
  payload?.issue?.number;

export const createComment = async (comment: string) => {
  const octokit = getOctokit(getInput('github-token'));
  const issueNumber = getIssueNumber(context.payload);
  if (!issueNumber) {
    warning('Issue number not found. Impossible to create a comment');
    return;
  }

  await octokit.issues.createComment({
    repo: context.repo.repo,
    owner: context.repo.owner,
    body: comment,
    issue_number: issueNumber
  });
};

export const generateCoverageSummary = async (jestCommand: string): Promise<string> =>
  await execCommand(jestCommand, summaryFormatter);

const getBooleanInput = (input: string): boolean | undefined => {
  switch (getInput(input)) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return undefined;
  }
};

const generateChangeSinceParam = (baseCommand: string) => {
  const param = getBooleanInput('only-changes');
  if (!param) {
    return '';
  }

  if (baseCommand.includes('changeSince')) {
    return '';
  }

  if (context.payload.pull_request?.base) {
    return `--changeSince=${context.payload.pull_request?.base.ref}`;
  }

  return '';
};

export const generateJestCommand = () => {
  const baseCommand = getInput('jest-command');
  const changeSinceParam = generateChangeSinceParam(baseCommand);
  return `${baseCommand} ${changeSinceParam}`;
};
