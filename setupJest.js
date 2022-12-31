import fs from 'fs';
import v8Profiler from 'v8-profiler-next';

const isProfiling = process.env.PROFILE === 'true';

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
