import { useState, useEffect } from "react";
import Pagination from "../../components/Pagination";
import KanaFilter from "../../components/KanaFilter";
import AlertMessage from "../../components/AlertMessage";
import { useLocation } from "react-router";
import { companyApi } from "../../api/companyApi";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import NoDataMessage from "../../components/NoDataMessage";
import DataTable from "../../components/DataTable";
import { useAdminGuard } from "../../hooks/useAdminGuard";

export default function CompanyList() {
  // 管理者以外は自動でリダイレクトされるため、この下のコードは全員「管理者」とみなせる
  useAdminGuard("/");

  const [companys, setCompanys] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentKana, setCurrentKana] = useState("");

  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );

  useEffect(() => {
    companyApi
      .getList(currentPage, currentKana)
      .then((res) => {
        setCompanys(res.companys);
        setTotalPages(res.totalPages);
      })
      .catch((error) => {
        console.error("通信エラー:", error);
      });
  }, [currentPage, currentKana]);

  const handleSelectKana = (kana) => {
    setCurrentKana(kana);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const columns = [
    { label: "発注元名", key: "companyName" },
    { label: "郵便番号", key: "formattedCompanyPostalcode" },
    { label: "住所", key: "companyAddress" },
    { label: "電話番号", key: "formattedCompanyPhone" },
    {
      label: "操作",
      render: (c) => (
        <Button to={`/companys/${c.companyId}`} variant="primary">
          詳細
        </Button>
      ),
    },
  ];

  return (
    // 管理者専用なので `theme-contractee` などの切り替えは不要！
    <div className="content-wrapper">
      <PageHeader title="発注元管理" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      {/* 管理者専用なので常に新規登録ボタンを出してOK */}
      <div className="action-bar">
        <Button to="/companys/add" variant="primary">
          新規発注元登録
        </Button>
      </div>

      <div className="card">
        <h3>発注元一覧</h3>

        <KanaFilter currentKana={currentKana} onSelectKana={handleSelectKana} />

        {companys && companys.length > 0 ? (
          <DataTable columns={columns} data={companys} />
        ) : (
          <NoDataMessage message="現在、登録されている発注元はありません。" />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}