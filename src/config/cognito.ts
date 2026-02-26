// AWS Cognito Configuration
export const cognitoConfig = {
  region: 'us-east-1', // Change to your region
  userPoolId: 'us-east-1_t5r8H1Rtt', // Replace with your User Pool ID
  userPoolWebClientId: '3e5go12trenaph9dscsvg5m5sm', // Replace with your App Client ID
};

// Instructions to get these values:
// 1. Go to AWS Console: https://console.aws.amazon.com/cognito
// 2. Select your User Pool
// 3. User Pool ID: Found in "User pool overview"
// 4. App Client ID: Go to "App integration" tab → "App clients" → Copy "Client ID"
