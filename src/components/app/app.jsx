import React, {
  useEffect,
  useContext,
  useState,
} from 'react';
import styled from 'styled-components';
import IPFS from 'ipfs';
import OrbitDB from 'orbit-db';
import {
  Flex,
  Box,
} from '@rebass/grid';

const Card = styled.div`
  width: 250px;
  min-height: 100px;
  background-color: #f5f5f5;
  margin-top: 30px;
  margin-bottom: 30px;
  padding: 10px;
`;

const Label = styled.label`
  display: block;
`;

const Input = styled.input`
  display: block;
`;

const CreatedAt = styled.span`
  font-family: 'Rubik', sans-serif;
  color: #c1c1c1;
  font-size: 12px;
`;

const Tag = styled.span`
  font-family: 'Rubik', sans-serif;
  color: #c1c1c1;
  font-size: 12px;
`;

const Message = styled.span`
  font-family: 'Rubik', sans-serif;
  color: #010101;
  font-size: 14px;
`;

function App() {
  const [db, setDb] = useState();
  const [chat, setChat] = useState([]);

  const [msg, setMsg] = useState('');
  const [pic, setPic] = useState('');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState('');


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

        /* const loadedDb = await orbitdb.create('postables', 'eventlog', {
          accessController: {
            write: [
              '*',
            ],
          },
        }); */

        const loadedDb = await orbitdb.open('/orbitdb/zdpuB3WiH3zDw1izSwAZBaoTnC6LFvdtymWzVxbPCTY99kMP9/postables');

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
    const msgToAdd = {
      pic,
      link,
      message: msg,
      createdAt: Date.now(),
      tag,
    };

    const hash = await db.add(msgToAdd);
    console.log(hash);
    setMsg('');
    setLink('');
    setPic('');
    setTag('');
  }

  function displayChat() {
    const messages = [];

    const options = {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    for (let i = 0; i < chat.length; i += 1) {
      const date = new Date(chat[i].createdAt);

      messages.push(
        <Card key={chat[i].createdAt}>
          <Flex>
            <Box width={1 / 2}>
              <CreatedAt>
                {date.toLocaleDateString('default', options)}
              </CreatedAt>
            </Box>
            <Box width={1 / 2}>
              <Tag>
                {chat[i].tag}
              </Tag>
            </Box>
          </Flex>
          {chat[i].pic !== '' && (
            <Box>
              <img src={chat[i].pic} alt="img" width={150} />
            </Box>
          )}
          <Box>
            <Message>
              {chat[i].message}
            </Message>
          </Box>
          {chat[i].link !== '' && (
            <Box>
              <a href={chat[i].link} target="_blank" rel="noopener noreferrer">
                Visit link
              </a>
            </Box>
          )}
        </Card>,
      );
    }

    return messages;
  }

  return (
    <>
      <h1>Dechan</h1>
      <Label htmlFor="message">
        Message
        <Input
          name="message"
          type="text"
          placeholder="Message"
          value={msg}
          onChange={e => setMsg(e.target.value)}
        />
      </Label>
      <Label htmlFor="pic">
        Picture
        <Input
          name="pic"
          type="text"
          placeholder="http://imgur.com/..."
          value={pic}
          onChange={e => setPic(e.target.value)}
        />
      </Label>
      <Label htmlFor="link">
        Link
        <Input
          name="link"
          type="text"
          placeholder="http://wikipedia.org/..."
          value={link}
          onChange={e => setLink(e.target.value)}
        />
      </Label>
      <Label htmlFor="tag">
        Tag
        <Input
          name="tag"
          type="text"
          placeholder="Funny"
          value={tag}
          onChange={e => setTag(e.target.value)}
        />
      </Label>
      <button type="button" onClick={() => send()}>
        Send
      </button>
      {displayChat()}
    </>
  );
}

export default App;
