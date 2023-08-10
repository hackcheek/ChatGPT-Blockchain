# ChatGPT-Blockchain
ChatGPT en Blockchain es la vanguardia de la libertad de información, creando una plataforma de inteligencia artificial completamente descentralizada, transparente e inmune a la censura.

Zero knowledge machine learning is too slow for this. If it takes 1 to 10 seconds for a chat AI to respond, with zero knowledge it would take 10 minutes to 2 hours to respond!

Instead, we use a completely different approach, using the blockchain: We have multiple nodes run the SAME deterministic AI model and we use a smart contract to check that the output of all nodes is the same content.

Then, the smart contract uses a consensus mechanism to find the most popular result.

This way, nodes that give an incorrect output are punished, and those with a correct output are rewarded for their honest work.

This allows for a fully decentralized, AI chat running on the blockchain in REAL TIME, which cannot be censored or shut down.

## How it's Made
We first use huggingface to create a large-language model (like GPT2 or Alpaca) which we then upload to IPFS.

The web app always points to this ipfs url to make use of this model. When a user writes a prompt, it is first uploaded to ipfs as well, and the url is sent to a smart contract, along with the model url.

Multiple nodes are listening to the smart contract TaskAdded event, and download both the model and prompt from ipfs. Once downloaded, the run the inference (predicting the output) in a deterministic way.

They then upload each of their output urls to the smart contract, which will determine which url is the most popular.

URLs in ipfs are created based on a hash of their content, and thus for nodes to all output the same url, they need to have created the same content.

Finally, the smart contract uses a simple consensus mechanism to reward nodes that uploaded the right output url, and punish those with an incorrect url.

The web app then downloads the output file from ipfs and shows the response to the user.
