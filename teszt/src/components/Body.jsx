import { useState, useEffect } from "react";

export default function Body({ onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/products");
        if (!response.ok) {
          throw new Error("Termékek letöltése sikertelen");
        }
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main>
      <div className="carousel-wrapper">
        <div className="carousel" id="carousel">
          <button className="carousel-arrow left" id="carousel-left"></button>
          <img
            src="img/asd.webp"
            className="carousel-img"
            style={{ display: "block" }}
          />
          <img
            src="img/asdasdds.jpg"
            className="carousel-img"
            style={{ display: "none" }}
          />
          <img
            src="img/lukas.jpg"
            className="carousel-img"
            style={{ display: "none" }}
          />
          <img
            src="img/sor.jpg"
            className="carousel-img"
            style={{ display: "none" }}
          />
          <img
            src="img/kezmu.jpg"
            className="carousel-img"
            style={{ display: "none" }}
          />
          <button className="carousel-arrow right" id="carousel-right"></button>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-9">
            <section className="latest-ads">
              <h2>Legújabb Termékek</h2>
              <div id="all-ads-container" className="ads-grid">
                {loading && (
                  <p className="loading-text">Termékek betöltése...</p>
                )}
                {error && <p className="error-text">Hiba: {error}</p>}
                {!loading && products.length === 0 && (
                  <p className="no-products">Még nincsenek termékek</p>
                )}
                {!loading &&
                  products.map((product) => (
                    <div
                      key={product._id}
                      className="product-card"
                      onClick={() => onProductClick(product._id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="product-card-image">
                        <img src={product.imageUrl} alt={product.productName} />
                      </div>
                      <div className="product-card-info">
                        <h3 className="product-card-name">
                          {product.productName}
                        </h3>
                        <p className="product-card-description">
                          {product.description.substring(0, 80)}...
                        </p>
                        <div className="product-card-footer">
                          <span className="product-card-price">
                            {product.price} Ft
                          </span>
                          <span className="product-card-location">
                            {product.location}
                          </span>
                        </div>
                        <p className="product-card-seller">
                          Eladó: {product.createdBy}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
          <div className="col-3">
            <section className="news-section">
              <h2 id="news">Hírek</h2>
              <div className="news-items">
                <div className="news-item">
                  <h3>Új kézműves kategória</h3>
                  <p className="news-date">2025. október 9.</p>
                  <p>
                    Új kerámiák és agyagedények kategória nyílt! Fedezze fel
                    egyedi kézműves termékeinket.
                  </p>
                </div>
                <div className="news-item">
                  <h3>Őszi vásár</h3>
                  <p className="news-date">2025. október 8.</p>
                  <p>
                    Készüljön az őszre kézműves dekorációkkal! Különleges
                    ajánlatok egész héten.
                  </p>
                </div>
                <div className="news-item">
                  <h3>Kézműves workshop</h3>
                  <p className="news-date">2025. október 7.</p>
                  <p>
                    Hétvégi workshop: Tanulja meg a kosárfonás alapjait helyi
                    mesterektől!
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
