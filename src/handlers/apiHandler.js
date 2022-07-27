const axios = require('axios');
const axiosRetry = require('axios-retry');
const _ = require('lodash');
const aws = require('aws-sdk');

// API docs https://open-meteo.com/en/docs#latitude=53.3441&longitude=-6.2675&hourly=temperature_2m,relativehumidity_2m,rain
// This api does not require auth

// Environment variables
const ENV = process.env.ENV;
const API_TO_FETCH = process.env.API_TO_FETCH;
const LANDING_BUCKET_NAME = `${ENV}-${process.env.LANDING_BUCKET_BASE_NAME}`;
const S3_FILE_NAME_PREFIX = process.env.S3_FILE_NAME_PREFIX;
const AWS_REGION = process.env.AWS_REGION;

const getHourlyData = async () => {
  try {
    axiosRetry(axios); // Will retry 3 times by default
    const res = await axios.get(API_TO_FETCH);
    return Promise.resolve(res.data);
  } catch (error) {
    const errorMessage = _.get(error, 'data.reason', '');
    const errorStatus = _.get(error, 'response.status, ');
    const errorStatusText = _.get(error, 'response.statusText', '');
    console.error('Error calling API', {
      error,
      errorMessage,
      errorStatus,
      errorStatusText,
      api_url: API_TO_FETCH
    });
  }
};

function createS3FileNameAndPath () {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Add 1 as 0 is January. TODO need to format this so '7' is '07'
  const currentDateOfMonth = currentDate.getDate();
  const currentHour = currentDate.getHours();
    
  const currentEpochTimestamp = currentDate.getTime(); // todays date in epoch e.g 1658825663844
  const folderPath = `year=${currentYear}/month=${currentMonth}/day=${currentDateOfMonth}/hour=${currentHour}`; // e.g year=2022/month=07/day=27 ( This allows for partitioning the data later on)
  const fileName = `${S3_FILE_NAME_PREFIX}_${currentEpochTimestamp}.json`;
  const fullFilePath = `${folderPath}/${fileName}`;

  return {
    fileName,
    folderPath,
    fullFilePath
  };
}

const writeDataToS3 = async (apiResult) => {
  
  const {fileName,folderPath, fullFilePath} = createS3FileNameAndPath();

  // Create S3 Client
  const s3Client = new aws.S3({
    region: AWS_REGION
  }); 
  
  const uploadParams = {
    Bucket: LANDING_BUCKET_NAME,
    Key: fullFilePath,
    Body: JSON.stringify(apiResult)
  };
  
  console.log('Uploading data to S3', {
    bucketName: LANDING_BUCKET_NAME,
    folderPath: folderPath,
    fileName: fileName
  });
  
  try {
    const results = await s3Client.upload(uploadParams).promise();
    return results; // No need to return results here, but good to check, and then log
  } catch (error) {
    console.error('Error writing to S3', {
      error,
      errorStatus: error.statusCode,
      errorMessage: error.code,
  
    });
  }  
};

exports.apiHandler = async (event, context) => {
  console.info('Lambda called with environment variables', {ENV, LANDING_BUCKET_NAME, S3_FILE_NAME_PREFIX, API_TO_FETCH, AWS_REGION});
  try {
    const resData = await getHourlyData();
    const writeToS3Result = await writeDataToS3(resData);
    console.info('File has been written to S3 successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('Error with handler', error);
  }
};
