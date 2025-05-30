// const WidgetsChart = () => {
//   const calculateTotal = <T extends MiniBarChartData>(
//     data: T,
//     categoryKey: keyof T[number],
//   ): number => {
//     const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
//     return data.reduce((sum, item) => {
//       return sum + dataKeys.reduce((keySum, key) => keySum + Number(item[key] || 0), 0);
//     }, 0);
//   };
//   return (
//     <div style={{ display: "flex", flexDirection: "row", gap: 18 }}>
//       <div style={{ width: "100%", overflowX: "auto" }}></div>
//       <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
//         <span style={{ fontSize: 24, fontWeight: "600", color: "black", lineHeight: "28px" }}>
//           {calculateTotal(data, categoryKey).toLocaleString()}
//         </span>
//         <span style={{ fontSize: 14, color: "gray", lineHeight: "20px", fontWeight: "400" }}>
//           {label}
//         </span>
//       </div>
//     </div>
//   );
// };

// export default WidgetsChart;
