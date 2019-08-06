import React, {
  useEffect,
  useContext,
  useState,
} from 'react';
import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';

function App() {
  const [db, setDb] = useState();
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    function init() {
      const ipfsOptions = {
        EXPERIMENTAL: {
          pubsub: true,
        },
        config: {
          Addresses: {
            Swarm: [
              '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
            ],
          },
        },
      };

      const ipfs = new IPFS(ipfsOptions);

      ipfs.on('error', e => console.error(e));

      ipfs.on('ready', async () => {
        const orbitdb = await OrbitDB.createInstance(ipfs);

        /* const loadedDb = await orbitdb.create('posts', 'eventlog', {
          accessController: {
            write: [
              '*',
            ],
          },
        }); */

        const loadedDb = await orbitdb.open('/orbitdb/zdpuAnkXDMG5MxLSAXjh9dKJT7KMaT83Po5CChgVAbnik5Lbc/posts');

        /* const loadedDb = await orbitdb.create('dechan', 'eventlog', {
          accessController: {
            write: ['*'],
          },
        }); */

        console.log(loadedDb.address);

        await loadedDb.load();
        setDb(loadedDb);

        loadedDb.events.on('load', () => {
          console.log('Loading...');
        });

        loadedDb.events.on('ready', () => {
          console.log('Ready!');
        });

        loadedDb.events.on('synced', (res) => {
          console.log('Synced!', res);
        });

        loadedDb.events.on('replicate', () => {
          console.log('Replicating...');
        });

        loadedDb.events.on('replicated', () => {
          console.log('Replicated');

          const result = loadedDb.iterator({ limit: -1 }).collect();

          console.log(result);

          const formattedChat = [];

          for (let i = 0; i < result.length; i += 1) {
            formattedChat.push(result[i].payload.value);
          }

          setChat(formattedChat);
        });

        const result = loadedDb.iterator({ limit: -1 }).collect();

        console.log(result);

        const formattedChat = [];

        for (let i = 0; i < result.length; i += 1) {
          formattedChat.push(result[i].payload.value);
        }

        setChat(formattedChat);
      });
    }

    init();
  }, []);

  async function send() {
    const hash = await db.add(msg);
    console.log(hash);
    setMsg('');
  }

  function displayChat() {
    const messages = [];

    for (let i = 0; i < chat.length; i += 1) {
      messages.push(
        <p key={i}>
          {chat[i]}
        </p>,
      );
    }

    return messages;
  }

  return (
    <>
      <h1>Dechan</h1>
      <input
        type="text"
        placeholder="Message"
        value={msg}
        onChange={e => setMsg(e.target.value)}
      />
      <button type="button" onClick={() => send()}>
        Send
      </button>
      {displayChat()}
    </>
  );
}

export default App;
