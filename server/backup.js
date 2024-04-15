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

app.get("/", async function (req, res) {
  try {
    const client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(azureApiKey)
    );

    const messages = [{ role: "user", content: "list top 5 dissertations" }];
    console.log(`Message: ${messages.map((m) => m.content).join("\n")}`);
    const events = await client.streamChatCompletions(deploymentId, messages, {
      "temperature": 0,
      "max_tokens": 1000,
      "top_p": 1.0,
      "dataSources": [
        {
          "type": "AzureCognitiveSearch",
          "parameters": {
            "endpoint": searchEndpoint,
            "key": searchKey,
            "indexName": searchIndex,
          },
        },
      ],
      "messages": [
        {
          "role": "user",
          "content": "List top 5 dissertations",
        },
      ],
    });
    // {
    //   maxTokens: 128,
    //   azureExtensionOptions: {
    //     extensions: [
    //       {
    //         type: "AzureCognitiveSearch",
    //         endpoint: searchEndpoint,
    //         key: searchKey,
    //         indexName: searchIndex,
    //         queryType: "Keyword",
    //       },
    //     ],
    //   },
    // }
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
