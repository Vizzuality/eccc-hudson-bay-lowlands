import type { FC, SVGProps } from "react";

const CheckIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g filter="url(#filter0_ii_5845_6328)">
      <path
        d="M9 0C4.0374 0 0 4.0374 0 9C0 13.9626 4.0374 18 9 18C13.9626 18 18 13.9626 18 9C18 4.0374 13.9626 0 9 0ZM7.2009 12.9717L3.8592 9.6372L5.13 8.3628L7.1991 10.4283L11.9637 5.6637L13.2363 6.9363L7.2009 12.9717Z"
        fill="white"
        fill-opacity="0.4"
      />
      <path
        d="M9 0C4.0374 0 0 4.0374 0 9C0 13.9626 4.0374 18 9 18C13.9626 18 18 13.9626 18 9C18 4.0374 13.9626 0 9 0ZM7.2009 12.9717L3.8592 9.6372L5.13 8.3628L7.1991 10.4283L11.9637 5.6637L13.2363 6.9363L7.2009 12.9717Z"
        stroke="transparent"
      />
    </g>
    <defs>
      <filter
        id="filter0_ii_5845_6328"
        x="0"
        y="0"
        width="18"
        height="18"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="2.38243" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect1_innerShadow_5845_6328"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="7.14728" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_innerShadow_5845_6328"
          result="effect2_innerShadow_5845_6328"
        />
      </filter>
    </defs>
  </svg>
);

export default CheckIcon;
