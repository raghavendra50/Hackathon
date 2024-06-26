const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

dotenv.config({
  path: ".env",
});

const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const azureApiKey = process.env["AZURE_OPENAI_API_KEY"];
const deploymentId = process.env["AZURE_OPENAI_DEPLOYMENT_ID"];
const searchEndpoint = process.env["AZURE_AI_SEARCH_ENDPOINT"];
const searchKey = process.env["AZURE_AI_SEARCH_API_KEY"];
const searchIndex = process.env["AZURE_AI_SEARCH_INDEX"];

console.log(
  endpoint,
  azureApiKey,
  deploymentId,
  searchEndpoint,
  searchKey,
  searchIndex
);

const app = express();
app.use([bodyParser.json(), cors()]);

app.get("/chatCompletion", async function (req, res) {
  try {
    const client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(azureApiKey)
    );

    const messages = [{ role: "user", content: "list top 10 dissertations" }];

    const events = await client.streamChatCompletions(deploymentId, messages, {
      maxTokens: 128,
      azureExtensionOptions: {
        extensions: [
          {
            type: "azure_search",
            endpoint: searchEndpoint,
            indexName: searchIndex,
            authentication: {
              type: "api_key",
              key: searchKey,
            },
          },
        ],
      },
    });
    let response = "";
    for await (const event of events) {
      for (const choice of event.choices) {
        const newText = choice.delta?.content;
        if (!!newText) {
          response += newText;
          // To see streaming results as they arrive, uncomment line below
          // console.log(newText);
        }
      }
    }
    console.log(response);
    res.send(response);
  } catch (err) {
    console.log(err);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on PORT: ${process.env.PORT}`);
});
