import fs from 'fs';

/**
 * TODO: profiler support disabled until Node v20 is supported.
 * https://github.com/hyj1991/v8-profiler-next/issues/65
 */
// import v8Profiler from 'v8-profiler-next';

const isProfiling = false; // process.env.PROFILE === 'true';

if (isProfiling) {
  const timestamp = new Date().getTime();
  const getProfileName = () => expect.getState().currentTestName;

  v8Profiler.setGenerateType(1);

  beforeEach(() => {
    v8Profiler.startProfiling(getProfileName(), true);
  });

  afterEach(() => {
    const profile = v8Profiler.stopProfiling(getProfileName());
    const filename = (getProfileName() ?? new Date().toUTCString())
      .trim()
      .replace('/', '_')
      .replace(/[ \-]+/g, '-')
      .replace(/[^A-Za-z0-9\-]/g, '')
      .toLowerCase();

    profile.export((_error, result) => {
      fs.writeFileSync(`profiles/${filename}-${timestamp}.cpuprofile`, result);
      profile.delete();
    });
  });
}
