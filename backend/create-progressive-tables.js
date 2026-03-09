import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createUserProgressTable() {
  const params = {
    TableName: 'CodeBattleUserProgress',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    console.log('📝 Creating CodeBattleUserProgress table...');
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log('✅ CodeBattleUserProgress table created!');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('✅ CodeBattleUserProgress table already exists!');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function createDailyQuestionsTable() {
  const params = {
    TableName: 'CodeBattleDailyQuestions',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'date', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    console.log('📝 Creating CodeBattleDailyQuestions table...');
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log('✅ CodeBattleDailyQuestions table created!');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('✅ CodeBattleDailyQuestions table already exists!');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function createUserStreaksTable() {
  const params = {
    TableName: 'CodeBattleUserStreaks',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    console.log('📝 Creating CodeBattleUserStreaks table...');
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log('✅ CodeBattleUserStreaks table created!');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('✅ CodeBattleUserStreaks table already exists!');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
}

async function createAllTables() {
  await createUserProgressTable();
  await createDailyQuestionsTable();
  await createUserStreaksTable();
}

createAllTables()
  .then(() => {
    console.log('\n🎉 All progressive system tables created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
