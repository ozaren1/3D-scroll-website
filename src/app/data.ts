type Frame = {
    id: number;
    content?: number | string;
    src?:string;
    position?: string;
    background?: boolean;
    text: boolean;
    type: string;

  };

  const items:Frame[] = [
    { id: 5, type: "vertical", position: "left",  text: true, content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Harum ipsum, animi distinctio tenetur sed, fugiat doloremque, odio iusto tempora molestiae omnis minima quidem nostrum mollitia quam aspernatur facere. Voluptates, aliquid.", background: true,},

    { id: 1, type: "horizontal", position: "right", text: false, src: "/assets/video/3.mp4", background: true,},
    { id: 2, type: "vertical", position: "left", text: false, src: "/assets/video/2.mp4", background: true,},
    { id: 3, type: "horizontal", position: "right",  text: false, src: "/assets/video/3.mp4", background: true,},
    { id: 4, type: "vertical", position: "left",  text: true, content: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Harum ipsum, animi distinctio tenetur sed, fugiat doloremque, odio iusto tempora molestiae omnis minima quidem nostrum mollitia quam aspernatur facere. Voluptates, aliquid.", background: true,},


    
  ];



export default items;