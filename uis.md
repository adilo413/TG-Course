from now one I willl add some ui designs for the website in here and you will apply them from here, and also when u apply them please make sure you customize them both for dark and light theme.


For our back buttons lets use:

<!-- From Uiverse.io by Navarog21 --> 
<button>
    Hover me
</button>
/* From Uiverse.io by Navarog21 */ 
button {
  width: 10em;
  position: relative;
  height: 3.5em;
  border: 3px ridge #149CEA;
  outline: none;
  background-color: transparent;
  color: white;
  transition: 1s;
  border-radius: 0.3em;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

button::after {
  content: "";
  position: absolute;
  top: -10px;
  left: 3%;
  width: 95%;
  height: 40%;
  background-color: #212121;
  transition: 0.5s;
  transform-origin: center;
}

button::before {
  content: "";
  transform-origin: center;
  position: absolute;
  top: 80%;
  left: 3%;
  width: 95%;
  height: 40%;
  background-color: #212121;
  transition: 0.5s;
}

button:hover::before, button:hover::after {
  transform: scale(0)
}

button:hover {
  box-shadow: inset 0px 0px 25px #1479EA;
}

Customize it for both dark and light theme.




For a folder:

<!-- From Uiverse.io by Nawsome --> 
<button class="continue-application">
    <div>
        <div class="pencil"></div>
        <div class="folder">
            <div class="top">
                <svg viewBox="0 0 24 27">
                    <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z"></path>
                </svg>
            </div>
            <div class="paper"></div>
        </div>
    </div>
    Continue Application
</button>

/* From Uiverse.io by Nawsome */ 
.continue-application {
  --color: #fff;
  --background: #404660;
  --background-hover: #3A4059;
  --background-left: #2B3044;
  --folder: #F3E9CB;
  --folder-inner: #BEB393;
  --paper: #FFFFFF;
  --paper-lines: #BBC1E1;
  --paper-behind: #E1E6F9;
  --pencil-cap: #fff;
  --pencil-top: #275EFE;
  --pencil-middle: #fff;
  --pencil-bottom: #5C86FF;
  --shadow: rgba(13, 15, 25, .2);
  border: none;
  outline: none;
  cursor: pointer;
  position: relative;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  line-height: 19px;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
  padding: 17px 29px 17px 69px;
  transition: background 0.3s;
  color: var(--color);
  background: var(--bg, var(--background));
}

.continue-application > div {
  top: 0;
  left: 0;
  bottom: 0;
  width: 53px;
  position: absolute;
  overflow: hidden;
  border-radius: 5px 0 0 5px;
  background: var(--background-left);
}

.continue-application > div .folder {
  width: 23px;
  height: 27px;
  position: absolute;
  left: 15px;
  top: 13px;
}

.continue-application > div .folder .top {
  left: 0;
  top: 0;
  z-index: 2;
  position: absolute;
  transform: translateX(var(--fx, 0));
  transition: transform 0.4s ease var(--fd, 0.3s);
}

.continue-application > div .folder .top svg {
  width: 24px;
  height: 27px;
  display: block;
  fill: var(--folder);
  transform-origin: 0 50%;
  transition: transform 0.3s ease var(--fds, 0.45s);
  transform: perspective(120px) rotateY(var(--fr, 0deg));
}

.continue-application > div .folder:before, .continue-application > div .folder:after,
.continue-application > div .folder .paper {
  content: "";
  position: absolute;
  left: var(--l, 0);
  top: var(--t, 0);
  width: var(--w, 100%);
  height: var(--h, 100%);
  border-radius: 1px;
  background: var(--b, var(--folder-inner));
}

.continue-application > div .folder:before {
  box-shadow: 0 1.5px 3px var(--shadow), 0 2.5px 5px var(--shadow), 0 3.5px 7px var(--shadow);
  transform: translateX(var(--fx, 0));
  transition: transform 0.4s ease var(--fd, 0.3s);
}

.continue-application > div .folder:after,
.continue-application > div .folder .paper {
  --l: 1px;
  --t: 1px;
  --w: 21px;
  --h: 25px;
  --b: var(--paper-behind);
}

.continue-application > div .folder:after {
  transform: translate(var(--pbx, 0), var(--pby, 0));
  transition: transform 0.4s ease var(--pbd, 0s);
}

.continue-application > div .folder .paper {
  z-index: 1;
  --b: var(--paper);
}

.continue-application > div .folder .paper:before, .continue-application > div .folder .paper:after {
  content: "";
  width: var(--wp, 14px);
  height: 2px;
  border-radius: 1px;
  transform: scaleY(0.5);
  left: 3px;
  top: var(--tp, 3px);
  position: absolute;
  background: var(--paper-lines);
  box-shadow: 0 12px 0 0 var(--paper-lines), 0 24px 0 0 var(--paper-lines);
}

.continue-application > div .folder .paper:after {
  --tp: 6px;
  --wp: 10px;
}

.continue-application > div .pencil {
  height: 2px;
  width: 3px;
  border-radius: 1px 1px 0 0;
  top: 8px;
  left: 105%;
  position: absolute;
  z-index: 3;
  transform-origin: 50% 19px;
  background: var(--pencil-cap);
  transform: translateX(var(--pex, 0)) rotate(35deg);
  transition: transform 0.4s ease var(--pbd, 0s);
}

.continue-application > div .pencil:before, .continue-application > div .pencil:after {
  content: "";
  position: absolute;
  display: block;
  background: var(--b, linear-gradient(var(--pencil-top) 55%, var(--pencil-middle) 55.1%, var(--pencil-middle) 60%, var(--pencil-bottom) 60.1%));
  width: var(--w, 5px);
  height: var(--h, 20px);
  border-radius: var(--br, 2px 2px 0 0);
  top: var(--t, 2px);
  left: var(--l, -1px);
}

.continue-application > div .pencil:before {
  -webkit-clip-path: polygon(0 5%, 5px 5%, 5px 17px, 50% 20px, 0 17px);
  clip-path: polygon(0 5%, 5px 5%, 5px 17px, 50% 20px, 0 17px);
}

.continue-application > div .pencil:after {
  --b: none;
  --w: 3px;
  --h: 6px;
  --br: 0 2px 1px 0;
  --t: 3px;
  --l: 3px;
  border-top: 1px solid var(--pencil-top);
  border-right: 1px solid var(--pencil-top);
}

.continue-application:before, .continue-application:after {
  content: "";
  position: absolute;
  width: 10px;
  height: 2px;
  border-radius: 1px;
  background: var(--color);
  transform-origin: 9px 1px;
  transform: translateX(var(--cx, 0)) scale(0.5) rotate(var(--r, -45deg));
  top: 26px;
  right: 16px;
  transition: transform 0.3s;
}

.continue-application:after {
  --r: 45deg;
}

.continue-application:hover {
  --cx: 2px;
  --bg: var(--background-hover);
  --fx: -40px;
  --fr: -60deg;
  --fd: .15s;
  --fds: 0s;
  --pbx: 3px;
  --pby: -3px;
  --pbd: .15s;
  --pex: -24px;
}



For our cards lets use this design:
<!-- From Uiverse.io by Yaya12085 --> 
<div class="card">
<div class="header">
						<span class="title">Beginner</span>
						<span class="price">Free</span>
					</div>
					<p class="desc">Etiam ac convallis enim, eget euismod dolor.</p>
					<ul class="lists">
						<li class="list">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
							</svg>
							<span>Aenean quis</span>
						</li>
						<li class="list">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
							</svg>
							<span>Morbi semper</span>
						</li>
						<li class="list">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
							</svg>
							<span>Tristique enim nec</span>
						</li>
					</ul>
					<button type="button" class="action">Get Started</button>
				</div>

        /* From Uiverse.io by Yaya12085 */ 
.card {
  margin-left: -1rem;
  margin-right: -1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  margin-bottom: 2rem;
  width: 320px;
  display: flex;
  flex-direction: column;
  border-radius: 0.25rem;
  background-color: rgba(17, 24, 39, 1);
  padding: 1.5rem;
}

.header {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  color: #fff
}

.price {
  font-size: 3.75rem;
  line-height: 1;
  font-weight: 700;
  color: #fff
}

.desc {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  line-height: 1.625;
  color: rgba(156, 163, 175, 1);
}

.lists {
  margin-bottom: 1.5rem;
  flex: 1 1 0%;
  color: rgba(156, 163, 175, 1);
}

.lists .list {
  margin-bottom: 0.5rem;
  display: flex;
  margin-left: 0.5rem
}

.lists .list svg {
  height: 1.5rem;
  width: 1.5rem;
  flex-shrink: 0;
  margin-right: 0.5rem;
  color: rgba(167, 139, 250, 1);
}

.action {
  border: none;
  outline: none;
  display: inline-block;
  border-radius: 0.25rem;
  background-color: rgba(167, 139, 250, 1);
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(17, 24, 39, 1);
}


for the light and the dark theme toggle lets use:
<!-- From Uiverse.io by RiccardoRapelli --> 
<label class="switch">
  <input id="input" type="checkbox" checked="darkTheme" />
  <div class="slider round">
    <div class="sun-moon">
      <svg id="moon-dot-1" class="moon-dot" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="moon-dot-2" class="moon-dot" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="moon-dot-3" class="moon-dot" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="light-ray-1" class="light-ray" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="light-ray-2" class="light-ray" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="light-ray-3" class="light-ray" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>

      <svg id="cloud-1" class="cloud-dark" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="cloud-2" class="cloud-dark" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="cloud-3" class="cloud-dark" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="cloud-4" class="cloud-light" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="cloud-5" class="cloud-light" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
      <svg id="cloud-6" class="cloud-light" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="50"></circle>
      </svg>
    </div>
    <div class="stars">
      <svg id="star-1" class="star" viewBox="0 0 20 20">
        <path
          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
        ></path>
      </svg>
      <svg id="star-2" class="star" viewBox="0 0 20 20">
        <path
          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
        ></path>
      </svg>
      <svg id="star-3" class="star" viewBox="0 0 20 20">
        <path
          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
        ></path>
      </svg>
      <svg id="star-4" class="star" viewBox="0 0 20 20">
        <path
          d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"
        ></path>
      </svg>
    </div>
  </div>
</label>
/* From Uiverse.io by RiccardoRapelli */ 
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch #input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #2196f3;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  z-index: 0;
  overflow: hidden;
}

.sun-moon {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: yellow;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

#input:checked + .slider {
  background-color: black;
}

#input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}

#input:checked + .slider .sun-moon {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
  background-color: white;
  -webkit-animation: rotate-center 0.6s ease-in-out both;
  animation: rotate-center 0.6s ease-in-out both;
}

.moon-dot {
  opacity: 0;
  transition: 0.4s;
  fill: gray;
}

#input:checked + .slider .sun-moon .moon-dot {
  opacity: 1;
}

.slider.round {
  border-radius: 34px;
}

.slider.round .sun-moon {
  border-radius: 50%;
}

#moon-dot-1 {
  left: 10px;
  top: 3px;
  position: absolute;
  width: 6px;
  height: 6px;
  z-index: 4;
}

#moon-dot-2 {
  left: 2px;
  top: 10px;
  position: absolute;
  width: 10px;
  height: 10px;
  z-index: 4;
}

#moon-dot-3 {
  left: 16px;
  top: 18px;
  position: absolute;
  width: 3px;
  height: 3px;
  z-index: 4;
}

#light-ray-1 {
  left: -8px;
  top: -8px;
  position: absolute;
  width: 43px;
  height: 43px;
  z-index: -1;
  fill: white;
  opacity: 10%;
}

#light-ray-2 {
  left: -50%;
  top: -50%;
  position: absolute;
  width: 55px;
  height: 55px;
  z-index: -1;
  fill: white;
  opacity: 10%;
}

#light-ray-3 {
  left: -18px;
  top: -18px;
  position: absolute;
  width: 60px;
  height: 60px;
  z-index: -1;
  fill: white;
  opacity: 10%;
}

.cloud-light {
  position: absolute;
  fill: #eee;
  animation-name: cloud-move;
  animation-duration: 6s;
  animation-iteration-count: infinite;
}

.cloud-dark {
  position: absolute;
  fill: #ccc;
  animation-name: cloud-move;
  animation-duration: 6s;
  animation-iteration-count: infinite;
  animation-delay: 1s;
}

#cloud-1 {
  left: 30px;
  top: 15px;
  width: 40px;
}

#cloud-2 {
  left: 44px;
  top: 10px;
  width: 20px;
}

#cloud-3 {
  left: 18px;
  top: 24px;
  width: 30px;
}

#cloud-4 {
  left: 36px;
  top: 18px;
  width: 40px;
}

#cloud-5 {
  left: 48px;
  top: 14px;
  width: 20px;
}

#cloud-6 {
  left: 22px;
  top: 26px;
  width: 30px;
}

@keyframes cloud-move {
  0% {
    transform: translateX(0px);
  }

  40% {
    transform: translateX(4px);
  }

  80% {
    transform: translateX(-4px);
  }

  100% {
    transform: translateX(0px);
  }
}

.stars {
  transform: translateY(-32px);
  opacity: 0;
  transition: 0.4s;
}

.star {
  fill: white;
  position: absolute;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  animation-name: star-twinkle;
  animation-duration: 2s;
  animation-iteration-count: infinite;
}

#input:checked + .slider .stars {
  -webkit-transform: translateY(0);
  -ms-transform: translateY(0);
  transform: translateY(0);
  opacity: 1;
}

#star-1 {
  width: 20px;
  top: 2px;
  left: 3px;
  animation-delay: 0.3s;
}

#star-2 {
  width: 6px;
  top: 16px;
  left: 3px;
}

#star-3 {
  width: 12px;
  top: 20px;
  left: 10px;
  animation-delay: 0.6s;
}

#star-4 {
  width: 18px;
  top: 0px;
  left: 18px;
  animation-delay: 1.3s;
}

@keyframes star-twinkle {
  0% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.2);
  }

  80% {
    transform: scale(0.8);
  }

  100% {
    transform: scale(1);
  }
}
