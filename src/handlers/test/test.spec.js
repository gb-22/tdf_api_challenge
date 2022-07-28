const rewire = require('rewire');
const sinon = require('sinon');
const test = require('sinon-test')(sinon);
const chai = require('chai');
const expect = require('chai').expect;
const _ = require('lodash');
chai.use(require('sinon-chai'));
const sinonStubPromise = require('sinon-stub-promise');
sinonStubPromise(sinon);

let handleAsync = (fn) => {
  return done => {
    fn.call().then(done, err => {
      done(err);
    });
  };
};

const apiHandler = rewire('../apiHandler.js');

describe('apiHandler function', () => {
  it('Should call functions getHourlyData and writeDataToS3', test(handleAsync(async () => {
    // We don't want to actually call these functions, so stub them
    let getHourlyData = sinon.stub().callsFake(() => {
      return Promise.resolve();
    });

    let writeDataToS3 = sinon.stub().callsFake(() => {

    });

    apiHandler.__set__('getHourlyData', getHourlyData);
    apiHandler.__set__('writeDataToS3', writeDataToS3);

    await apiHandler.apiHandler();

    expect(getHourlyData).to.have.been.called;
    expect(writeDataToS3).to.have.been.called;
  })));
});

describe('createS3FileNameAndPath', () => {
  const createS3FileNameAndPath = apiHandler.__get__('createS3FileNameAndPath');
  it('Should create correct folder structure based on the current Date', () => {

    const {fileName,folderPath, fullFilePath} = createS3FileNameAndPath();
    const expectedFolderPathPattern =  new RegExp('(year=[0-9]{4})\/(month=[0-9]]*)\/(day=[0-9]*)\/(hour=[0-9]*)') //'year=2022/month=7/day=28/hour=11';
        
    expect(expectedFolderPathPattern.test(folderPath)).to.be.true;
    console.log({fileName,folderPath, fullFilePath});
  });
});
