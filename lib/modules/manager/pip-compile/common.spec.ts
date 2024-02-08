import { allowedPipOptions, extractHeaderCommand } from './common';

function getCommandInHeader(command: string) {
  return `#
# This file is autogenerated by pip-compile with Python 3.11
# by the following command:
#
#    ${command}
#
`;
}

describe('modules/manager/pip-compile/common', () => {
  describe('extractHeaderCommand()', () => {
    it.each([
      '-v',
      '--generate-hashes',
      '--resolver=backtracking',
      '--resolver=legacy',
      '--output-file=reqs.txt',
      '--extra-index-url=https://pypi.org/simple',
    ])('returns object on correct options', (argument: string) => {
      expect(
        extractHeaderCommand(
          getCommandInHeader(`pip-compile ${argument} reqs.in`),
          'reqs.txt',
        ),
      ).toBeObject();
    });

    it.each(['--resolver', '--output-file reqs.txt', '--extra = jupyter'])(
      'errors on malformed options with argument',
      (argument: string) => {
        expect(() =>
          extractHeaderCommand(
            getCommandInHeader(`pip-compile ${argument} reqs.in`),
            'reqs.txt',
          ),
        ).toThrow(/equal sign/);
      },
    );

    it.each(['--foo', '-x', '--$(curl this)', '--bar=sus', '--extra-large'])(
      'errors on unknown options',
      (argument: string) => {
        expect(() =>
          extractHeaderCommand(
            getCommandInHeader(`pip-compile ${argument} reqs.in`),
            'reqs.txt',
          ),
        ).toThrow(/not supported/);
      },
    );

    it.each(['--no-header'])(
      'always errors on not allowed options',
      (argument: string) => {
        expect(() =>
          extractHeaderCommand(
            getCommandInHeader(`pip-compile ${argument} reqs.in`),
            'reqs.txt',
          ),
        ).toThrow(/not allowed/);
      },
    );

    it.each(['--output-file', '--index-url'])(
      'throws on duplicate options',
      (argument: string) => {
        expect(() =>
          extractHeaderCommand(
            getCommandInHeader(
              `pip-compile ${argument}=xxx ${argument}=xxx reqs.in`,
            ),
            'reqs.txt',
          ),
        ).toThrow(/multiple/);
      },
    );

    it('error when no source files passed as arguments', () => {
      expect(() =>
        extractHeaderCommand(
          getCommandInHeader(`pip-compile --extra=color`),
          'reqs.txt',
        ),
      ).toThrow(/source/);
    });

    it('returned sourceFiles returns all source files', () => {
      const exampleSourceFiles = [
        'requirements.in',
        'reqs/testing.in',
        'base.txt',
        './lib/setup.py',
        'pyproject.toml',
      ];
      expect(
        extractHeaderCommand(
          getCommandInHeader(
            `pip-compile --extra=color ${exampleSourceFiles.join(' ')}`,
          ),
          'reqs.txt',
        ).sourceFiles,
      ).toEqual(exampleSourceFiles);
    });

    it.each(allowedPipOptions)(
      'returned sourceFiles must not contain options',
      (argument: string) => {
        const sourceFiles = extractHeaderCommand(
          getCommandInHeader(`pip-compile ${argument}=dd reqs.in`),
          'reqs.txt',
        ).sourceFiles;
        expect(sourceFiles).not.toContainEqual(argument);
        expect(sourceFiles).toEqual(['reqs.in']);
      },
    );
  });
});
