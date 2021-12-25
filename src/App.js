import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const RTC = ({ receiver = false }) => {
  const [peer, setPeer] = useState(null);
  const [channel, setChannel] = useState(null);

  const [offer, setOffer] = useState("");
  const [answer, setAnswer] = useState("");

  const [connected, setConnected] = useState(false);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  console.log(channel);

  useEffect(() => {
    const localConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        // audio: true,
      })
      .then((stream) => {
        console.log("GOT USER MEDIA", stream);
        localVideoRef.current.srcObject = stream;
        localConnection.addStream(stream);
      })
      .catch((err) => {
        console.log("UNABLE TO GET USER MEDIA", err);
      });

    if (receiver) {
      localConnection.ondatachannel = (e) => {
        localConnection.dataChannel = e.channel;
        localConnection.dataChannel.onopen = (e) => {
          console.log("[OPEN]");
          setConnected(true);
        };

        localConnection.dataChannel.onmessage = (e) => {
          console.log("[MESSAGE]", e.data);
        };

        localConnection.dataChannel.onclose = (e) => {
          console.log("[CLOSE]");
        };

        localConnection.dataChannel.onerror = (e) => {
          console.log("[ERROR]");
        };

        setChannel(localConnection.dataChannel);
      };
    } else {
      let dataChannel = localConnection.createDataChannel("channel");
      dataChannel.onopen = (e) => {
        console.log("[OPEN]");
        setConnected(true);
      };

      dataChannel.onmessage = (e) => {
        console.log("[MESSAGE]", e.data);
      };

      dataChannel.onclose = (e) => {
        console.log("[CLOSE]");
      };

      dataChannel.onerror = (e) => {
        console.log("[ERROR]");
      };

      setChannel(dataChannel);
    }

    localConnection.onicecandidate = (e) => {
      if (!receiver) {
        // if caller
        setOffer(JSON.stringify(localConnection.localDescription));
      } else {
        // if receiver
        setAnswer(JSON.stringify(localConnection.localDescription));
      }
    };

    localConnection.ontrack = (e) => {
      if (remoteVideoRef.current.srcObject !== e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    setPeer(localConnection);
  }, [receiver]);

  // Peer 2
  const createAnswer = () => {
    peer
      .createAnswer()
      .then((a) => {
        peer
          .setLocalDescription(a)
          .then(() => {
            console.log("[ANSWER CREATED]");
          })
          .catch(() => {
            console.log("[ANSWER CREATION ERROR 2]");
          });
      })
      .catch(() => {
        console.log("[ANSWER CREATION ERROR 1]");
      });
  };
  const submitOffer = () => {
    peer
      .setRemoteDescription(JSON.parse(offer))
      .then(() => {
        console.log("[OFFER SET]");
        createAnswer();
      })
      .catch((err) => {
        console.log("[OFFER SET ERROR]");
      });
  };

  // PEER 1
  const createOffer = () => {
    peer
      .createOffer()
      .then((o) => {
        peer.setLocalDescription(o).then(() => {
          console.log("[OFFER CREATED]");
        });
      })
      .catch((err) => {
        console.log("[OFFER CREATION ERROR]");
      });
  };
  const submitAnswer = () => {
    peer
      .setRemoteDescription(JSON.parse(answer))
      .then(() => {
        console.log("[ANSWER SET]");
      })
      .catch((err) => {
        console.log("[ANSWER SET ERROR]");
      });
  };

  return (
    <>
      {receiver ? (
        <>
          <h1>PEER 2</h1>
          <textarea
            placeholder="Paste offer code"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
          />
          <button onClick={submitOffer}>Submit Offer</button>
          <textarea
            placeholder="Answer will be here..."
            value={answer}
            readOnly
          />
        </>
      ) : (
        <>
          <h1>PEER 1</h1>
          <button onClick={createOffer}>Create Offer</button>
          <textarea
            placeholder="Offer will be here..."
            value={offer}
            readOnly
          />
          <textarea
            placeholder="Paste answer code"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button onClick={submitAnswer}>Submit Answer</button>
        </>
      )}
      {connected ? (
        <>
          <p style={{ color: "green", fontWeight: "bold" }}>CONNECTED</p>
        </>
      ) : (
        <p style={{ color: "red", fontWeight: "bold" }}>NOT CONNECTED</p>
      )}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          height: "auto",
          width: "200px",
          backgroundColor: "#f2f2f2",
        }}
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          height: "auto",
          width: "100%",
          backgroundColor: "#f2f2f2",
        }}
      />
    </>
  );
};

const Caller = () => {
  return (
    <div>
      Caller <RTC />
    </div>
  );
};

const Receiver = () => {
  return (
    <div>
      Receiver <RTC receiver={true} />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Caller />} />
        <Route path="/:room_id" element={<Receiver />} />
      </Routes>
    </BrowserRouter>
  );
}
