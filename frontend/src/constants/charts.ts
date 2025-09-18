import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function createProfileChart(container: HTMLElement): Chart {
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
      datasets: [
        {
          label: "# of Votes",
          data: [12, 19, 3, 5, 2, 3],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
