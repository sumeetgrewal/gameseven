# gameseven

Figma : https://www.figma.com/file/Z8zXzJePxaCViBKFMkycgA/7-Wonders?node-id=0%3A1

## Tech Stack
- Server: Express
- Frontend: React
- Node v.14.3.0
- AWS EC2
- AWS DynamoDB, S3

## Setup

### Server
1. Navigate to /server
2. Run `Yarn`
3. Run `Yarn dev`

### Client
1. Navigate to /client
2. Run `Yarn`
3. Run `Yarn start`

### Starting both server & client
1. Navigate to /client
2. Run `Yarn dev`

## Build
1. Navigate to /server
2. Run `Yarn deploy`

## Deploy
AWS credentials must be configured and EB CLI must be installed
1. Navigate to /prod-build
2. Run `eb init` and select the appropriate region and app
3. Navigate to /.elasticbeanstalk
4. In the config.yml file, add 
```
deploy:
  artifact: react-nodejs.zip
```
5. Run `eb deploy`

## Collaborators
[@vinielk](https://github.com/vinielk)
[@rishav11](https://github.com/rishav11)
[@sumeetgrewal](https://github.com/sumeetgrewal)
