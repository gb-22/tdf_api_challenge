## Prerequisites
- AWS account (Free account used)
- IAM user profile created that has admin priveleges (required to deploy infra)
-  `aws-cli` installed on machine. (I am using a Mac)
- `aws-sam cli` is installed

## Overview
This application deploys infrastructure required to ingest data from an API that provides hourly weather, (temperature only)  for Galway, Ireland, for the next 7 days, and writes the data to S3.

API Documentation: https://open-meteo.com/en/docs
Extra weather variables can be added here: https://open-meteo.com/en/docs
Timezone is UTC

This API was chosen as it doesn't require authentication - making it easier for anyone to run this application. See below for more information on this

## Notes and assumptions
- This application is written in Node.js
- The project structure was created using `sam init` and then modified accordingly
- The API provides hourly data for the next 7 days.
- The data is stored in year/month/day/hour buckets. This partitions the data, making it easier downstream to a) Create a Glue crawler to crawl each day/hour folder, and when querying the data.
- The file name has the current unix time appended to it. In case the job was run more frequently than hourly, the existing data file would not be overwritten
- Basic unit tests included to ensure main functions run 
- The application has permission to write logs to cloudwatch. When logging, any information that may later need to be queried, is stored as an object (e.g fileName, errorStatus). This makes it easier downstream to query logs (via Cloudwatch or OpenSearch)
- The api results from this request are small, so there is no need to chunk the requests, or worry about the lambda crashing/timing out
- This application does not contain any logic - this is generally done downstream, once the data has been written to the landing/raw folder. This means that it is configurable - You can run this application with any api, that doesn't require auth.


## Future Enhancements
- It would be interesting to see how the weather forecast changes depending on when the prediction was made (i.e today, it forecasts that it will rain in 6 days time, how often does this forecast change for this time the closer we get), and this could be done by mapping the data to a visual tool. This could be done by creating a glue crawler to run daily or hourly and making the data available in Athena. The data could then be cleaned up by creating a view on it, and then the view can be read by Quicksight, where the data can be visualised. 

- Refactor to use CDK instead of Cloudformation templates. (Haven't played around with CDK enough to use it now)

## How to run

### Build artifacts
`sam build`
This will package the code so it is ready to run


### Deploy 
Running this command will create a new s3 bucket, and store the artifacts in here.

This will also create a new IAM role,
`sam deploy --guided --profile <your-aws-profile-name>`
This will result in a config file called samconfig.toml.
When deploying, this file can be used, or the arguments can be passed through in the `sam-deploy` command
