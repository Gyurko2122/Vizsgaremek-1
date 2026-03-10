export default function Body() {
  return (
    <main>

            <div className="carousel-wrapper">
                <div className="carousel" id="carousel">
                    <button className="carousel-arrow left" id="carousel-left"></button>
                    <img src="img/asd.webp" className="carousel-img" style={{display: 'block'}} />
                    <img src="img/asdasdds.jpg" className="carousel-img" style={{display: 'none'}} />
                    <img src="img/lukas.jpg" className="carousel-img" style={{display: 'none'}} />
                    <img src="img/sor.jpg" className="carousel-img" style={{display: 'none'}} />
                    <img src="img/kezmu.jpg" className="carousel-img" style={{display: 'none'}} />
                    <button className="carousel-arrow right" id="carousel-right"></button>
                </div>
            </div>
        <div className="container">
            <div className="row">
                <div className="col-9">
                    <section className="latest-ads">
                        <h2>Legújabb Termékek</h2>
                        <div id="all-ads-container" className="ads-grid"></div>
                    </section>
                </div>
                <div className="col-3">
                    <section className="news-section">
                        <h2 id="news">Hírek</h2>
                        <div className="news-items">
                            <div className="news-item">
                                <h3>Új kézműves kategória</h3>
                                <p className="news-date">2025. október 9.</p>
                                <p>Új kerámiák és agyagedények kategória nyílt! Fedezze fel egyedi kézműves termékeinket.</p>
                            </div>
                            <div className="news-item">
                                <h3>Őszi vásár</h3>
                                <p className="news-date">2025. október 8.</p>
                                <p>Készüljön az őszre kézműves dekorációkkal! Különleges ajánlatok egész héten.</p>
                            </div>
                            <div className="news-item">
                                <h3>Kézműves workshop</h3>
                                <p className="news-date">2025. október 7.</p>
                                <p>Hétvégi workshop: Tanulja meg a kosárfonás alapjait helyi mesterektől!</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </main>
    );
}