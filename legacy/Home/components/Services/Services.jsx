import "./Services.css"

export default function Service({
    title,
     titleBlue,
      paragraf,
      head1,
      head2,
      head3,
      text1,
      text2,
      txt3,
      icon1,
      icon2,
      icon3,
      clasOrage,
      clas,
      waterMark}) {
    return (
        <>
        <section className={`${clas} `} >
            
            
        <img src={waterMark} alt="waterMark" className="water-mark"/>  
            
            <div className="container">
                <div className="mb-4 mb-md-0">

                 <h2>{title} <span>{titleBlue}</span></h2>   
                   <p>{paragraf}</p> 
                    
                </div>
                    <div className="boxes">

                        <div className="single-box">
                        <div className="icon">{icon1}</div>
                            <div className="group">
                            <h3  className={`${clasOrage}`}>{head1}</h3>
                            <p>{text1}</p>
                            </div>
                        </div>
                        
                        <div className="single-box">
                            <div className="icon">{icon2}</div>
                            <div className="group">
                            <h3  className={`${clasOrage}`}> {head2}</h3>
                            <p>{text1}</p>
                            </div>
                        </div>
                        <div className="single-box">
                        <div className="icon">{icon3}</div>
                           <div className="group">
                           <h3 className={`${clasOrage}`}>{head3}</h3>
                           <p>{text1}</p>
                           </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
