import "./Impact.css"
import { BsCalendar4Event } from "react-icons/bs";
import { GrGroup } from "react-icons/gr";
import { LuCircleDashed } from "react-icons/lu";
export default function Impact({waterMark}) {
    return (
        <>
        <section className='bacground' >
            <img src={waterMark} alt="waterMark" className="water-mark"/>  
            <div className="container">
            <div className="mb-4 mb-md-0">

                 <h2>Our <span>Impact</span></h2>   
                   <p>We're dedicated to making education accessible and providing the resources students need to succeed globally.</p> 
                   </div>

                   <div className="boxes">
                    
                    <div className="single-box">
                            <div className="groups">
                                <span className="icons"><GrGroup /></span>
                                <span className="orang">8000</span>
                            </div>
                            <h3 className="head">Students attended
                            our programs</h3>
                    </div>

                    <div className="single-box">
                            <div className="groups">
                                <span className="icons"><LuCircleDashed /></span>
                                <span className="orang">96</span>
                            </div>
                            <h3 className="head">Partner</h3>
                    </div>

                    <div className="single-box">
                            <div className="groups">
                                <span className="icons"><BsCalendar4Event /></span>
                                <span className="orang">38</span>
                            </div>
                            <h3 className="head">Events and Programs</h3>
                    </div>
                   </div>
                </div>
            </section>
        </>
    );
}
