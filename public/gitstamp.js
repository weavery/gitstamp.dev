/* This is free and unencumbered software released into the public domain. */

function parseAuthor(author) {
  if (author.startsWith('https://github.com/')) {
    return {service: 'github', link: author, name: author.match(/([^\/]+)$/g)};
  }
  if (author.startsWith('https://gitlab.com/')) {
    return {service: 'gitlab', link: author, name: author.match(/([^\/]+)$/g)};
  }
  if (author.startsWith('https://bitbucket.org/')) {
    return {service: 'bitbucket', link: author, name: author.replace(/\/$/, '').match(/([^\/]+)$/g)};
  }
  if (author.startsWith('mailto:')) {
    return {service: 'email', link: author, name: author.replace('mailto:', '')};
  }
  return {service: null, link: null, name: author}; // unknown
}

function renderCommit(transactionID) {
  return `
    <div id="commit-${transactionID}" class="card my-4">
      <div class="card-header">
        <span id="commit-${transactionID}-id"></span>
      </div>
      <div class="card-body">
        <h5 class="card-title" id="commit-${transactionID}-title"></h5>
        <h6 class="card-subtitle mb-2 text-muted">
          by
          <img id="commit-${transactionID}-author-icon" src="email.svg" class="commit-author-icon"/>
          <a id="commit-${transactionID}-author" href="#"></a>
          on <span id="commit-${transactionID}-date"></span>
        </h6>
        <pre id="commit-${transactionID}-message" class="card-text" style="display: none;"></pre>
        <a id="commit-${transactionID}-txlink" href="https://viewblock.io/arweave/tx/${transactionID}" target="_blank" class="card-link">View transaction</a>
        <a id="commit-${transactionID}-link" href="#" target="_blank" class="card-link" style="display: none;">View commit</a>
      </div>
    </div>`;
}

async function query({ query, variables = null }) {
  const graphql = JSON.stringify({
    query,
    variables,
  });
  const requestOptions = {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: graphql,
  };
  const res = await fetch("https://arweave.dev/graphql", requestOptions);
  return await res.clone().json();
}

async function load(event) {
  const arweave = Arweave.init();
  arweave.network.getInfo().then(console.log);  // DEBUG

  const txs = (await query({
    query: `
    query {
      transactions(
        tags: [{ name: "App-Name", values: "Gitstamp" }]
        first: 2147483647
      ) {
        edges {
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }  
    `
  })).data.transactions.edges;

  for (const tx of txs) {
    console.log(`Loading transaction ${tx.node.id}...`);

    $('#commits').append(renderCommit(tx.node.id));

    arweave.transactions.getData(tx.node.id, {decode: true, string: true})
      .then(data => {
        const [title, ...body] = data.split("\n");
        $(`#commit-${tx.node.id}-title`).text(title);
        if (body.length > 0) {
          $(`#commit-${tx.node.id}-message`).text(body.join("\n")).show();
        }
      })
      .catch(error => {
        console.error(error);
        $(`#commit-${tx.node.id}`).hide();
      });

    tx.node.tags.forEach(tag => {
      const key = tag.name;
      const value = tag.value;
      switch (key) {
        case 'Git-Commit':
          $(`#commit-${tx.node.id}-id`).text(value);
          break;
        case 'Git-Commit-Link':
          $(`#commit-${tx.node.id}-link`).attr('href', value).show();
          break;
        case 'Git-Author':
          const author = parseAuthor(value);
          $(`#commit-${tx.node.id}-author`).attr('href', author.link);
          $(`#commit-${tx.node.id}-author`).text((author.service == 'email' ? '' : '@') + author.name);
          $(`#commit-${tx.node.id}-author-icon`).attr('src', author.service + ".svg");
          break;
        case 'Git-Committer-Date':
          $(`#commit-${tx.node.id}-date`).text(value.replace('T', ' '));
          break;
      }
    })
  }
}

$(document).ready(load);
