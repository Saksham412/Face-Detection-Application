// Accessing webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    const video = document.getElementById('video');
    video.srcObject = stream;
    video.play();
  })
  .catch(err => console.error('Error accessing webcam:', err));


  // Load face-api.js models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('path/to/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('path/to/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('path/to/models'),
  ]).then(startDetection);
  
  // Start face detection
  function startDetection() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const displaySize = { width: video.width, height: video.height };
  
    faceapi.matchDimensions(canvas, displaySize);
  
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video,
        new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
  
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  
      if (detections.length > 0) {
        // Tag and save faces
        const taggedFaces = await tagFaces(video, detections);
        saveTaggedFaces(taggedFaces);
      }
    }, 100);
  }
  
  // Function to tag faces
  async function tagFaces(video, detections) {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const taggedFaces = [];
  
    for (let i = 0; i < detections.length; i++) {
      const face = detections[i];
      const { width, height, top, left } = face.detection.box;
  
      // Draw a border around the face
      context.strokeStyle = '#00FF00';
      context.lineWidth = 2;
      context.strokeRect(left, top, width, height);
  
      // Tagged face
      const faceImg = await getFaceImage(video, face.landmarks.positions);
      taggedFaces.push({ faceImg, left, top, width, height });
    }
  
    return taggedFaces;
  }
  
  // Function to capture face image
  async function getFaceImage(video, landmarks) {
    const faceCanvas = faceapi.createCanvasFromMedia(video);
    const faceContext = faceCanvas.getContext('2d');
  
    const minX = Math.min(...landmarks.map(p => p.x));
    const minY = Math.min(...landmarks.map(p => p.y));
    const maxX = Math.max(...landmarks.map(p => p.x));
    const maxY = Math.max(...landmarks.map(p => p.y));
  
    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
  
    faceCanvas.width = faceWidth;
    faceCanvas.height = faceHeight;
  
    faceContext.drawImage(video, minX, minY, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);
  
    return faceCanvas.toDataURL('image/jpeg');
  }
  
  // Function to save tagged faces
  function saveTaggedFaces(taggedFaces) {
    // Send taggedFaces to the backend to save or display
    console.log('Tagged Faces:', taggedFaces);
    // Example: Send to backend via fetch API
    // fetch('/save-tagged-faces', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ taggedFaces }),
    // })
    // .then(response => response.json())
    // .then(data => console.log(data))
    // .catch(error => console.error('Error saving tagged faces:', error));
  }
  