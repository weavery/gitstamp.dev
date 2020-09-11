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

async function load(event) {
  const arweave = Arweave.init();
  arweave.network.getInfo().then(console.log);  // DEBUG

  const transactionIDs = await arweave.arql({
    op: "equals",
    expr1: "App-Name",
    expr2: "Gitstamp"
  });

  for (const transactionID of transactionIDs) {
    console.log(`Loading transaction ${transactionID}...`);

    $('#commits').append(renderCommit(transactionID));

    arweave.transactions.getData(transactionID, {decode: true, string: true})
      .then(data => {
        const [title, ...body] = data.split("\n");
        $(`#commit-${transactionID}-title`).text(title);
        if (body.length > 0) {
          $(`#commit-${transactionID}-message`).text(body.join("\n")).show();
        }
      })
      .catch(error => {
        console.error(error);
        $(`#commit-${transactionID}`).hide();
      });

    arweave.transactions.get(transactionID)
      .then(transaction => {
        transaction.get('tags').forEach(tag => {
          const key = tag.get('name', {decode: true, string: true});
          const value = tag.get('value', {decode: true, string: true});
          switch (key) {
            case 'Git-Commit':
              $(`#commit-${transactionID}-id`).text(value);
              break;
            case 'Git-Commit-Link':
              $(`#commit-${transactionID}-link`).attr('href', value).show();
              break;
            case 'Git-Author':
              const author = parseAuthor(value);
              $(`#commit-${transactionID}-author`).attr('href', author.link);
              $(`#commit-${transactionID}-author`).text((author.service == 'email' ? '' : '@') + author.name);
              $(`#commit-${transactionID}-author-icon`).attr('src', author.service + ".svg");
              break;
            case 'Git-Committer-Date':
              $(`#commit-${transactionID}-date`).text(value.replace('T', ' '));
              break;
          }
        });
      })
      .catch(error => {
        console.error(error);
        $(`#commit-${transactionID}`).hide();
      });
  }
}

$(document).ready(load);
